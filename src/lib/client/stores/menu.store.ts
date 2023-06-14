import { writable } from 'svelte/store';

interface State {
  isMobileMenuOpen: boolean;
}

const initialValue: State = {
  isMobileMenuOpen: false,
};

const store = writable<State>(initialValue);

export const menuStore = {
  subscribe: store.subscribe,
  toggle: (isOpen?: boolean) => {
    store.update(state => {
      return {
        ...state,
        isMobileMenuOpen: isOpen === undefined ? !state.isMobileMenuOpen : isOpen,
      };
    });
  },
};
