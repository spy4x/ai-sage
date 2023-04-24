<script lang="ts" context="module">
  // Code in this <script> tag is shared between all instances of this component to avoid creating a formatter for each instance

  /** Formatter that converts a number like "1000000" to "1,000,000"*/
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 0,
  });

  function formatDuration(ms: number) {
    // format as seconds if the value is greater than 1 second
    if (ms > 1000) {
      return `${Math.round(ms / 1000)} sec`;
    }
    // otherwise, format as milliseconds
    return `${formatter.format(ms)} ms`;
  }
</script>

<script lang="ts">
  // Code in this <script> tag is executed for each instance of this component
  import { chatStore } from '$lib/stores';
  import type { Message, UserState } from '$lib/stores';

  export let message: Message;
  export let messageIndex: number;
  export let user: UserState;
</script>

<div
  class="{message.role === 'assistant' ? 'bg-gray-800/70' : ''} py-2 px-3 max-w-2xl mx-auto rounded"
>
  <div class="flex items-center gap-2 mb-2">
    {#if message.role === 'user'}
      {#if user.photoURL}
        <img class="h-10 w-10 inline-block rounded-full" src={user.photoURL} alt={user.title} />
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="feather feather-user h-10 w-10 inline-block rounded-full bg-white text-black"
          ><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle
            cx="12"
            cy="7"
            r="4"
          /></svg
        >
      {/if}
      <span>{user.title}</span>
    {:else}
      <img src="/favicon.svg" alt="Assistant" class="h-10 w-10 inline-block bg-white rounded" />
      <span class="text-xl">Sage</span>
      {#if message.responseTime}
        <span class="text-slate-300 text-xs mt-0.5">
          {formatDuration(message.responseTime)}
        </span>
      {/if}
    {/if}
    <button
      title="Delete message"
      class="ml-auto"
      on:click={() =>
        $chatStore.selectedChat && chatStore.removeMessage($chatStore.selectedChat, messageIndex)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 text-slate-400 hover:text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
  <div class="message">
    {@html message.content}

    {#if message.isFlagged}
      <div class="mt-2 border border-red-500 text-red-500 rounded p-3">
        ⚠️ This message was flagged as inappropriate. Please delete it and ask something else.
        <button
          on:click={() =>
            $chatStore.selectedChat &&
            chatStore.removeMessage($chatStore.selectedChat, messageIndex)}
          class="btn-danger w-32 block mt-3">Delete</button
        >
      </div>
    {/if}
  </div>
</div>
