<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { chatStore, menuStore } from '../stores';
  import SidebarProfile from './sidebar-profile.svelte';
  import type { Chat } from '@types';

  const dispatch = createEventDispatcher();

  function select(chat: Chat) {
    dispatch('select', { chat });
    menuStore.toggle(false);
  }
</script>

<ul class="flex flex-1 flex-col gap-y-7">
  {#if $chatStore.isLoadingChats}
    <div class="animate-pulse flex space-x-4">
      <div class="flex-1 space-y-4 py-1">
        <div class="h-4 bg-slate-700 rounded" />
        <div class="h-4 bg-slate-700 rounded" />
        <div class="h-4 bg-slate-700 rounded" />
      </div>
    </div>
  {:else}
    <button
      on:click={() => {
        void chatStore.create(`Chat #${$chatStore.chats.length + 1}`);
        menuStore.toggle(false);
      }}
      class="btn-secondary hidden xl:inline-flex"
    >
      Create chat
    </button>
    {#if $chatStore.chats.length === 0}
      <p class="text-gray-400 text-sm leading-6 font-medium">No chats yet</p>
    {:else}
      <li>
        <div class="text-xs font-medium leading-6 text-gray-400">Your chats</div>
        <ul class="mt-2 space-y-1">
          {#each $chatStore.chats as chat}
            <li>
              <button
                class="{chat.id === $chatStore.selectedChatId
                  ? 'bg-gray-800 text-white'
                  : ''} w-full text-gray-400 hover:text-white hover:bg-gray-800 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-medium"
                on:click={() => select(chat)}
              >
                <span class="truncate">{chat.title}</span>

                <button
                  on:click={e => {
                    e.stopPropagation();
                    void chatStore.remove(chat);
                  }}
                  class="ml-auto text-gray-400 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </button>
            </li>
          {/each}
        </ul>
      </li>
    {/if}
  {/if}
  <li class="mt-auto">
    <SidebarProfile />
  </li>
</ul>
