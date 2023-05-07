import { derived, get, writable } from 'svelte/store';
import { authStore } from './auth.store';
import { arrayUnion, generateId, remove, set, subscribeToCollection, update } from '../services/db';

export interface Message {
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
  isLoadingChats: true,
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
  if (Object.keys(state).length === 0) {
    return;
  }
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

function selectChatMutation(id?: string, exceptId?: string): Partial<State> {
  const state = get(dataStore);
  if (id) {
    return { selectedChatId: id };
  }
  if (
    state.selectedChatId &&
    state.selectedChatId !== exceptId &&
    state.chats.find(chat => chat.id === state.selectedChatId)
  ) {
    return {};
  }
  if (state.chats.length) {
    return { selectedChatId: state.chats.find(chat => chat.id !== exceptId)?.id };
  } else {
    return { selectedChatId: undefined };
  }
}

export const chatStore = {
  subscribe: viewStore.subscribe,
  create: async (title?: string): Promise<void> => {
    try {
      const state = get(chatStore);
      if (!title) {
        title = `Chat #${state.chats.length + 1}`;
      }
      const chatId = generateId();
      updateState({
        isCreatingChat: true,
        creatingChatError: undefined,
        ...selectChatMutation(chatId),
      });
      const chat: Partial<Chat> = {
        title,
        isAnswering: false,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const path = getChatIdPath(userId, chatId);
      await set(path, chat);
      updateState({
        isCreatingChat: false,
        creatingChatError: undefined,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        updateState({ isCreatingChat: false, creatingChatError: error.message });
      }
    }
  },
  message: async (content: string): Promise<void> => {
    updateState({ isCreatingMessage: true, creatingMessageError: undefined });
    try {
      const state = get(chatStore);
      if (!state.selectedChatId) {
        return;
      }
      const path = getChatIdPath(userId, state.selectedChatId);
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
    updateState(selectChatMutation(undefined, chat.id));
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
  select: (chatId?: string): void => {
    updateState(selectChatMutation(chatId));
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
