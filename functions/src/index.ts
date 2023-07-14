import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue, Firestore } from '@google-cloud/firestore';

import { MessageSchema, ChatSchema } from '../../src/lib/shared/types';
import type { Message, Chat } from '../../src/lib/shared/types';
import { z } from 'zod';
import { chatgpt } from './chatgpt';

const db = new Firestore();

const FIRESTORE_DOC_ID_LENGTH = 20;
const RequestSchema = z.object({
  chatId: z.string().length(FIRESTORE_DOC_ID_LENGTH),
});

export const api = functions
  .region('europe-west1')
  .runWith({ maxInstances: 5, timeoutSeconds: 300 })
  .https.onRequest(async (request, response) => {
    let chatId = '';
    let userId = '';
    let jwt = '';
    let chat: undefined | Chat = undefined;
    let message: undefined | Message = undefined;

    // #region Authorization
    // get jwt from authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      response.status(401).send('No authorization header provided with bearer token.');
      return;
    }
    // parse JWT using Firebase Admin SDK
    jwt = authHeader.includes('Bearer ') ? authHeader.split(' ')[1] : '';
    if (!jwt) {
      response.status(401).send('No JWT provided in authorization header. Format: "Bearer <JWT>"');
      return;
    }
    const decodedToken = await admin.auth().verifyIdToken(jwt);
    userId = decodedToken.uid;
    // #endregion Authorization

    // #region Parse request
    try {
      ({ chatId } = RequestSchema.parse(request.query));
      message = MessageSchema.parse(request.body);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        response.status(400).json({
          code: 'validation',
          message: 'Invalid request',
          errors: error.errors,
        });
      }
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
        response.status(404).send('Chat not found');
        return;
      }
      chat = ChatSchema.parse({ ...chatSnapshot.data(), id: chatSnapshot.id });
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof z.ZodError) {
        response.status(400).json({
          code: 'validation',
          message: 'Invalid chat',
          errors: error.errors,
        });
      }
      response.status(500).send('Internal server error');
    }
    // #endregion Fetch chat

    if (!chat || !message) {
      response.status(500).send('Internal server error');
      return;
    }

    // exit if any message is flagged
    const isAnyMessageFlagged = chat.messages.some(message => message.isFlagged);
    if (isAnyMessageFlagged) {
      response.status(403).send('Chat is flagged');
      return;
    }

    try {
      const messages = [...chat.messages, message];
      const { content, title, responseTime, isFlagged } = await chatgpt(messages, userId);
      await saveAnswer(userId, chatId, content, responseTime, chat, title, isFlagged, messages);
      response.sendStatus(200);
    } catch (error: unknown) {
      if ((error as any).isAxiosError) {
        console.error((error as any).response.data);
      } else {
        console.error(error);
      }
      response.status(500).send('Internal server error');
    }
  });

// export const answer = functions
//   .region('europe-west1')
//   .runWith({ maxInstances: 5, timeoutSeconds: 150 })
//   .firestore.document('users/{userId}/chats/{chatId}')
//   .onUpdate(async (snapshot, context) => {
//     const chat = snapshot.after.data();
//     const { userId, chatId } = context.params;

//     // #region Checks for early exit
//     const messagesBefore: Message[] = snapshot.before.data().messages;
//     const messagesAfter: Message[] = chat.messages;
//     if (!messagesAfter.length) {
//       return;
//     }
//     const isMessagesAmountSame = messagesBefore.length === messagesAfter.length;
//     const isLastMessageFromAssistant = messagesAfter[messagesAfter.length - 1].role === 'assistant';
//     if (isMessagesAmountSame || isLastMessageFromAssistant) {
//       return;
//     }

//     // user is not awaiting answer. Maybe just a message was deleted or something.
//     if (!chat.isAnswering) {
//       return;
//     }
//     // #endregion

//     try {
//       const { content, title, responseTime, isFlagged } = await sage(messagesAfter, userId);
//       await saveAnswer(
//         userId,
//         chatId,
//         content,
//         responseTime,
//         chat,
//         title,
//         isFlagged,
//         messagesAfter,
//       );
//     } catch (error: unknown) {
//       if ((error as any).isAxiosError) {
//         console.error((error as any).response.data);
//       } else {
//         console.error(error);
//       }
//     }
//   });

// async function dalleVariations(imageURL: string, userId: string): Promise<string[]> {
//   const downloadImageResponse = await fetch(imageURL);
//   const blob = await downloadImageResponse.blob();

//   const response = await openai.createImageVariation(blob as any, 4, '1024x1024', userId);
//   return response.data.data.map(image => image.url!);
// }

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
