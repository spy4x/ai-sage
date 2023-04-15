import { firestore } from 'firebase-functions';
import { FieldValue, Firestore } from '@google-cloud/firestore';
import { Configuration, OpenAIApi } from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

const db = new Firestore();

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  isAnswering: boolean;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

async function getAnswer(messages: Message[]) {
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
  });
  const message = response.data.choices[0].message;
  if (!message) {
    throw new Error('No answer from OpenAI:' + JSON.stringify(response.data, null, 4));
  }
  return message.content;
}

export const answer = firestore
  .document('users/{userId}/chats/{chatId}')
  .onUpdate(async (snapshot, context) => {
    const chat = snapshot.after.data();
    const { userId, chatId } = context.params;
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

    const [content, title] = await Promise.all([
      getAnswer(messagesAfter),
      messagesAfter.length === 1
        ? getAnswer([
            { role: 'user', content: messagesAfter[0].content },
            { role: 'user', content: 'Give my previous message a title. Max 5 words. No quotes' },
          ])
        : undefined,
    ]);
    console.log('answer', content);
    const doc = db.doc(`users/${userId}/chats/${chatId}`);
    const update = {
      messages: FieldValue.arrayUnion({
        role: 'assistant',
        content,
      }),
      isAnswering: false,
      updatedAt: FieldValue.serverTimestamp(),
      title: chat.title,
    };
    if (title) {
      update.title = title;
    }
    console.log('update', {
      answer: content,
      title,
    });
    await doc.update(update);
  });
