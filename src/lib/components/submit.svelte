<script lang="ts">
  import { chatStore } from '$lib/stores';
  import { createEventDispatcher } from 'svelte';

  let message = '';
  let messageInput: HTMLTextAreaElement;
  export function focus(): void {
    messageInput.focus();
  }

  const dispatch = createEventDispatcher();

  function submitOnEnter(e: KeyboardEvent): void {
    const specialKey = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    // if Special key + Enter = new line
    if (e.key === 'Enter' && !specialKey) {
      // else submit
      submit();
    }
  }

  function increaseOnTyping(): void {
    messageInput.style.height = `${messageInput.scrollHeight + 2}px`;
  }

  function submit(): void {
    message = message.trim();
    if (!message) {
      return;
    }
    message = message.replace(/\n/g, '<br/>'); // replace "\n" with "<br>" to preserve line breaks
    chatStore.message(message);
    message = '';
    messageInput.style.height = '';
    dispatch('submit'); // just to notify about event happened
  }
</script>

<form on:submit|preventDefault={submit} class="flex gap-2">
  <textarea
    bind:value={message}
    bind:this={messageInput}
    rows={1}
    class="input grow resize-none max-h-40 lg:max-h-60 2xl:max-h-80"
    placeholder="Your message"
    disabled={$chatStore.isCreatingMessage}
    on:keydown={submitOnEnter}
    on:input={increaseOnTyping}
  />

  <button
    class="btn-primary shrink-0 w-16 sm:w-20 self-end"
    disabled={!message || $chatStore.isCreatingMessage || !$chatStore.selectedChatId}
  >
    {#if $chatStore.isCreatingMessage}
      <svg
        class="animate-spin h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    {:else}
      <span>Send</span>
    {/if}
  </button>
</form>
