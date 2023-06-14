import { error, json, type RequestEvent } from '@sveltejs/kit';
import { ChatSchema, type Chat, type Message } from '@types';
import { MessageSchema } from '@types';
import * as admin from 'firebase-admin';
import { FieldValue, Firestore } from '@google-cloud/firestore';
import { z } from 'zod';
import { chatgpt } from '@server';

const db = new Firestore();

export async function POST(event: RequestEvent) {
  const requestBody = await event.request.json();
  const authorizationHeader = event.request.headers.get('authorization');
  const chatId = event.params.id!;
  let userId = '';
  let jwt = '';
  let chat: undefined | Chat = undefined;
  let message: undefined | Message = undefined;

  // #region Authorization
  // get jwt from authorization header
  const authHeader = authorizationHeader;
  if (!authHeader) {
    throw error(401, {
      message: 'No authorization header provided with bearer token.',
    });
  }
  // parse JWT using Firebase Admin SDK
  jwt = authHeader.includes('Bearer ') ? authHeader.split(' ')[1] : '';
  if (!jwt) {
    throw error(401, {
      message: 'No JWT provided in authorization header. Format: "Bearer <JWT>"',
    });
  }
  const decodedToken = await admin.auth().verifyIdToken(jwt);
  userId = decodedToken.uid;
  // #endregion Authorization

  // #region Parse request
  try {
    message = MessageSchema.parse(requestBody);
  } catch (e: unknown) {
    console.error(e);
    if (e instanceof z.ZodError) {
      throw error(400, {
        message: e.message,
      });
    }
    throw error(500);
  }
  // #endregion Parse request

  // #region Fetch chat
  try {
    const chatSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('chats')
      .doc(chatId)
      .get();
    if (!chatSnapshot.exists) {
      throw error(404, { message: 'Chat not found' });
    }
    chat = ChatSchema.parse({ ...chatSnapshot.data(), id: chatSnapshot.id });
  } catch (e: unknown) {
    console.error(e);
    if (e instanceof z.ZodError) {
      throw error(400, {
        message: e.message,
      });
    }
    throw error(500);
  }
  // #endregion Fetch chat

  if (!chat || !message) {
    console.error('Chat or message is undefined');
    throw error(500);
  }

  // exit if any message is flagged
  const isAnyMessageFlagged = chat.messages.some(message => message.isFlagged);
  if (isAnyMessageFlagged) {
    throw error(403, {
      message: 'Chat is flagged',
    });
  }

  try {
    const messages = [...chat.messages, message];
    const { content, title, responseTime, isFlagged } = await chatgpt(messages, userId);
    await saveAnswer(userId, chatId, content, responseTime, chat, title, isFlagged, messages);
    return json({ responseTime, isFlagged });
  } catch (e: unknown) {
    if ((e as any).isAxiosError) {
      console.error((e as any).response.data);
    } else {
      console.error(e);
    }
    throw error(500);
  }
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
