<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Submit from './submit.svelte';
  import NoChatMessages from './no-chat-messages.svelte';
  import ChatMessage from './chat-message.svelte';
  import { chatStore, authStore } from '../stores';

  const dispatch = createEventDispatcher();
  let scrollToBottomOfMessages: HTMLDivElement;

  function focus() {
    dispatch('focus');
  }

  // if $chatStore.selectedChat.messages.length changed - scroll page to the bottom
  let lengthBefore = 0;
  $: if (
    scrollToBottomOfMessages &&
    $chatStore.selectedChat?.messages.length &&
    $chatStore.selectedChat?.messages.length !== lengthBefore
  ) {
    lengthBefore = $chatStore.selectedChat.messages.length;
    scrollToBottomOfMessages.scrollIntoView({ behavior: 'smooth' });
  }
</script>

{#if $chatStore.selectedChat && $authStore.user}
  <div class="h-dscreen px-4 xl:px-10 pt-16 pb-6 xl:py-6 grid grid-rows-[1fr_auto] gap-4">
    <div class="messages-container overflow-hidden overflow-y-scroll space-y-4 pt-3">
      {#if $chatStore.selectedChat.messages.length}
        {#each $chatStore.selectedChat.messages as message, messageIndex}
          <ChatMessage user={$authStore.user} {message} {messageIndex} />
        {/each}
      {:else}
        <NoChatMessages />
      {/if}
      {#if $chatStore.isCreatingMessage || $chatStore.selectedChat.isAnswering}
        <div class="animate-pulse flex space-x-4 p-3 max-w-2xl mx-auto">
          <div class="flex-1 space-y-3 py-1">
            <div class="h-5 bg-slate-700 rounded" />
            <div class="h-5 bg-slate-700 rounded" />
          </div>
        </div>
      {/if}
      <div data-e2e="scroll-to-margin" />
      <div bind:this={scrollToBottomOfMessages} data-e2e="scroll-to-target" />
    </div>

    <div>
      <div class="max-w-3xl mx-auto">
        <Submit {focus} />
      </div>
    </div>
  </div>
{/if}
