import { writable } from 'svelte/store';
import { signInWithGoogle, subscribeToAuthState, signOut } from './services/auth';

interface State {
  user?: {
    id: string;
    title: string;
    photoURL?: string;
    displayName?: string;
    email?: string;
  };
  isLoading: boolean;
  loadingError?: string;
}

const initialValue: State = {
  isLoading: false,
};

const dataStore = writable<State>(initialValue);

export const authStore = {
  subscribe: dataStore.subscribe,
  signInWithGoogle,
  signOut,
};

subscribeToAuthState(user => {
  if (user) {
    dataStore.update(current => ({
      ...current,
      user: {
        id: user.uid,
        title: user.displayName || user.email || user.uid,
        photoURL: user.photoURL || undefined,
        displayName: user.displayName || undefined,
        email: user.email || undefined,
      },
    }));
  } else {
    dataStore.set(initialValue);
  }
});
