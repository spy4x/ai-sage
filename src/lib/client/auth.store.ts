import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { signInWithGoogle, subscribeToAuthState, signOut } from './services/auth';

interface State {
  user?: {
    id: string;
    title: string;
    photoURL?: string;
    displayName?: string;
    email?: string;
  };
  wasAuthenticated: boolean;
  isLoading: boolean;
  loadingError?: string;
}

const initialValue: State = {
  wasAuthenticated: getWasAuthenticated(),
  isLoading: false,
};

function getWasAuthenticated() {
  return browser && localStorage.getItem('wasAuthenticated') === 'true';
}

function setWasAuthenticated(value: boolean) {
  browser && localStorage.setItem('wasAuthenticated', value ? 'true' : 'false');
}

const dataStore = writable<State>(initialValue);

export const authStore = {
  subscribe: dataStore.subscribe,
  signInWithGoogle,
  signOut,
};

subscribeToAuthState(user => {
  if (user) {
    setWasAuthenticated(true);
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
    setWasAuthenticated(false);
    dataStore.set(initialValue);
  }
});
