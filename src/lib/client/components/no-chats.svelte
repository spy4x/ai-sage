<script>
  import { chatStore } from '@stores';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  const create = () => {
    dispatch('create');
  };
</script>

<div
  class="mx-4 lg:mx-auto mt-20 xl:mt-12 max-w-lg text-center p-12 rounded border border-dashed border-gray-500"
>
  {#if $chatStore.isLoadingChats}
    <div class="animate-pulse flex space-x-4">
      <div class="flex-1 space-y-4 py-1">
        <div class="h-4 bg-slate-700 rounded" />
        <div class="h-4 bg-slate-700 rounded" />
        <div class="h-4 bg-slate-700 rounded" />
      </div>
    </div>
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="mx-auto h-12 w-12 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
    <h3 class="mt-2 text-sm font-medium text-gray-100">No chats</h3>
    <p class="mt-1 text-sm text-gray-500">Get started by creating a new chat.</p>
    <div class="mt-6">
      <button on:click={create} class="btn-primary w-auto"> Create chat </button>
    </div>
  {/if}
</div>
