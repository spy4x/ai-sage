import * as functions from 'firebase-functions';
import { FieldValue, Firestore } from '@google-cloud/firestore';
import { Configuration, OpenAIApi } from 'openai';
import { marked } from 'marked';
import hljs from 'highlight.js';

// #region Config
const apiKey = process.env.OPENAI_API_KEY;
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

const db = new Firestore();

console.log('Before marked.setOptions');

// code highlighting
marked.setOptions({
  highlight: function (code, language) {
    return hljs.highlight(code, { language }).value;
  },
});

console.log('After marked.setOptions');
// #endregion

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  responseTime?: number;
  isFlagged?: boolean;
}

// interface Chat {
//   id: string;
//   title: string;
//   isAnswering: boolean;
//   messages: Message[];
//   createdAt: Date;
//   updatedAt: Date;
// }

export const answer = functions
  .region('europe-west1')
  .runWith({ maxInstances: 5 })
  .firestore.document('users/{userId}/chats/{chatId}')
  .onUpdate(async (snapshot, context) => {
    const chat = snapshot.after.data();
    const { userId, chatId } = context.params;

    // #region Checks for early exit
    const messagesBefore: Message[] = snapshot.before.data().messages;
    const messagesAfter: Message[] = chat.messages;
    if (!messagesAfter.length) {
      return;
    }
    const isMessagesAmountSame = messagesBefore.length === messagesAfter.length;
    const isLastMessageFromAssistant = messagesAfter[messagesAfter.length - 1].role === 'assistant';
    if (isMessagesAmountSame || isLastMessageFromAssistant) {
      return;
    }
    // exit if any message is flagged
    const isAnyMessageFlagged = messagesAfter.some(message => message.isFlagged);
    if (isAnyMessageFlagged) {
      return;
    }

    // user is not awaiting answer. Maybe just a message was deleted or something.
    if (!chat.isAnswering) {
      return;
    }
    // #endregion

    try {
      const { content, title, responseTime, isFlagged } = await sage(messagesAfter, userId);
      await saveAnswer(
        userId,
        chatId,
        content,
        responseTime,
        chat,
        title,
        isFlagged,
        messagesAfter,
      );
    } catch (error: unknown) {
      if ((error as any).isAxiosError) {
        console.error((error as any).response.data);
      } else {
        console.error(error);
      }
    }
  });

async function chatGPT(messages: Message[], userId: string) {
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
    user: userId,
  });
  const message = response.data.choices[0].message;
  if (!message) {
    throw new Error('No answer from OpenAI:' + JSON.stringify(response.data, null, 4));
  }
  return message.content;
}

async function sage(
  messages: Message[],
  userId: string,
): Promise<{
  content: string;
  title: string;
  responseTime: number;
  isFlagged: boolean;
}> {
  const startTime = Date.now();
  const validationResponse = await openai.createModeration({
    input: messages[messages.length - 1].content,
  });
  const validation = validationResponse.data.results[0];
  if (validation.flagged) {
    return {
      content: `⚠️ Your message was flagged as inappropriate. Please try to rephrase it.`,
      title: '',
      responseTime: Date.now() - startTime,
      isFlagged: true,
    };
  }
  const [content, title] = await Promise.all([
    generateAnswer(messages, userId),
    generateTitle(messages, userId),
  ]);
  const responseTime = Date.now() - startTime;
  return { content, title, responseTime, isFlagged: false };
}

async function generateAnswer(messages: Message[], userId: string): Promise<string> {
  // TODO: calculate tokens and cut off older messages
  const answer = await chatGPT(
    [
      {
        role: 'system',
        content:
          'Answer using Markdown code. For code snippets correctly set programming language.',
      },
      ...messages.map(message => ({ role: message.role, content: message.content })),
    ],
    userId,
  );
  console.log('answer before markdown', answer);
  return marked(answer);
}

async function generateTitle(messages: Message[], userId: string): Promise<string> {
  const isFirstMessage = messages.length === 1;
  if (!isFirstMessage) {
    return '';
  }
  return chatGPT(
    [
      {
        role: 'user',
        content: `Summarize text into max 5 words. No quotes or special characters. Text:"""
${messages[0].content}
"""`,
      },
    ],
    userId,
  );
}

async function saveAnswer(
  userId: string,
  chatId: string,
  content: string,
  responseTime: number,
  chat: FirebaseFirestore.DocumentData,
  title: string,
  isFlagged: boolean,
  messages: Message[],
) {
  const doc = db.doc(`users/${userId}/chats/${chatId}`);

  if (isFlagged) {
    messages[messages.length - 1].isFlagged = true;
    await doc.update({
      messages,
      isAnswering: false,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log('Message flagged', {
      title,
      responseTime,
      question: messages[messages.length - 1].content,
      answer: content,
    });
    return;
  }

  const update = {
    messages: [...messages, { role: 'assistant', content, responseTime }],
    isAnswering: false,
    updatedAt: FieldValue.serverTimestamp(),
    title: chat.title,
  };
  if (title) {
    update.title = title;
  }
  console.log('update', {
    title,
    responseTime,
    question: messages[messages.length - 1].content,
    answer: content,
  });
  await doc.update(update);
}
