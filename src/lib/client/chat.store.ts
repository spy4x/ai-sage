import { derived, get, writable } from 'svelte/store';
import { add, arrayUnion, update, subscribeToCollection, remove } from './services/db';
import { authStore } from './auth.store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  responseTime?: number;
  isFlagged: boolean;
}

export interface Chat {
  id: string;
  isAnswering: boolean;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface State {
  chats: Chat[];
  selectedChatId?: string;
  isLoadingChats: boolean;
  loadingChatsError?: string;
  isCreatingChat: boolean;
  creatingChatError?: string;
  isCreatingMessage: boolean;
  creatingMessageError?: string;
}

const initialValue: State = {
  chats: [],
  isLoadingChats: false,
  isCreatingChat: false,
  isCreatingMessage: false,
};

const dataStore = writable<State>(initialValue);
let userId = '';
const viewStore = derived(dataStore, $data => {
  const selectedChat = $data.chats.find(chat => chat.id === $data.selectedChatId);
  return {
    ...$data,
    selectedChat,
  };
});

function updateState(state: Partial<State>) {
  dataStore.update(current => ({
    ...current,
    ...state,
  }));
}

function getUserPath(userId: string) {
  return `users/${userId}`;
}
function getChatsPath(userId: string) {
  return `${getUserPath(userId)}/chats`;
}
function getChatIdPath(userId: string, chatId: string) {
  return `${getChatsPath(userId)}/${chatId}`;
}

function subscribeToChats(userId: string) {
  const path = getChatsPath(userId);
  updateState({
    chats: [],
    isLoadingChats: true,
    loadingChatsError: undefined,
    selectedChatId: undefined,
  });
  let isFirstFetch = true;
  return subscribeToCollection(
    { path, limit: 100, orderBy: { field: 'updatedAt', direction: 'desc' } },
    (chats: Chat[]) => {
      const update: Partial<State> = { chats, isLoadingChats: false, loadingChatsError: undefined };
      if (isFirstFetch) {
        // select first chat
        isFirstFetch = false;
        if (chats.length) {
          update.selectedChatId = chats[0].id;
        }
      }
      updateState(update);
    },
  );
}

export const chatStore = {
  subscribe: viewStore.subscribe,
  create: async (title: string): Promise<void> => {
    updateState({ isCreatingChat: true, creatingChatError: undefined });
    try {
      const chat: Partial<Chat> = {
        title,
        isAnswering: false,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const path = getChatsPath(userId);
      const createdChatId = await add(path, chat);
      updateState({
        isCreatingChat: false,
        creatingChatError: undefined,
        selectedChatId: createdChatId,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        updateState({ isCreatingChat: false, creatingChatError: error.message });
      }
    }
  },
  message: async (chatId: string, content: string): Promise<void> => {
    updateState({ isCreatingMessage: true, creatingMessageError: undefined });
    try {
      const path = getChatIdPath(userId, chatId);
      const chatUpdate = {
        messages: arrayUnion({
          role: 'user',
          content,
        }),
        isAnswering: true,
        updatedAt: new Date(),
      };
      await update(path, chatUpdate);
      updateState({ isCreatingMessage: false, creatingMessageError: undefined });
    } catch (error: unknown) {
      if (error instanceof Error) {
        updateState({ isCreatingMessage: false, creatingMessageError: error.message });
      }
    }
  },
  remove: async (chat: Chat): Promise<void> => {
    const path = getChatIdPath(userId, chat.id);
    if (chat.id === get(chatStore).selectedChatId) {
      chatStore.select(undefined);
    }
    await remove(path);
  },
  removeMessage: async (chat: Chat, messageIndex: number): Promise<void> => {
    const path = getChatIdPath(userId, chat.id);
    const messages = [...chat.messages];
    messages.splice(messageIndex, 1);
    const chatUpdate = {
      messages,
      updatedAt: new Date(),
    };
    await update(path, chatUpdate);
  },
  select: (chatId: undefined | string): void => {
    updateState({ selectedChatId: chatId });
  },
};

let unsubscribe: undefined | (() => void) = undefined;
authStore.subscribe(authState => {
  if (authState.user) {
    userId = authState.user.id;
    unsubscribe = subscribeToChats(authState.user.id);
  } else {
    userId = '';
    unsubscribe?.();
    unsubscribe = undefined;
    updateState(initialValue);
  }
});
