<script lang="ts">
  import { browser } from '$app/environment';
  import { authStore } from '$lib/client/auth.store';
  import { chatStore, type Chat } from '$lib/client/chat.store';
  import { get } from 'svelte/store';

  let message = '';
  let messageInput: HTMLTextAreaElement;
  let messagesContainer: HTMLDivElement;

  let isMobileMenuOpen = false;

  function toggle() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  const metaKey = browser && window.navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
  function focus() {
    messageInput?.focus();
  }

  function select(chat: Chat) {
    chatStore.select(chat.id);
    focus();
  }

  async function create() {
    await chatStore.create(`Chat #${$chatStore.chats.length + 1}`);
    focus();
  }

  // formatter that converts a number like "1000000" to "1,000,000"
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

  function submit() {
    const state = get(chatStore);
    message = message.trim();
    if (state.selectedChatId && message) {
      // replace "\n" with "<br>" to preserve line breaks
      message = message.replace(/\n/g, '<br/>');
      chatStore.message(state.selectedChatId, message);
      message = '';
    }
  }

  // if $chatStore.selectedChat.messages.length changed - scroll page to the bottom
  $: if ($chatStore.selectedChat?.messages.length && messagesContainer) {
    // scroll should be smooth
    messagesContainer.style.scrollBehavior = 'smooth';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
</script>

{#if $authStore.user}
  <div>
<!--    #region Mobile menu-->
    <div class="xl:hidden absolute top-0 inset-x-0 z-20 bg-gray-900 flex border-b border-white/5">
      <button on:click={toggle} type="button" class="p-5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
<!--    #endregion Mobile menu-->
    <!-- Sidebar -->
    <aside class="{ isMobileMenuOpen ? 'fixed inset-0 z-10 bg-gray-900 pt-16 h-screen overflow-y-scroll flex flex-col' : 'hidden' }
    xl:p-0 xl:bg-transparent xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-72 xl:flex-col"
    >
      <!-- Sidebar component, swap this element with another sidebar if you like -->
      <div
        class="h-full flex-1 flex flex-col pt-5 gap-y-5 overflow-y-auto bg-black/10 px-4 ring-1 ring-white/5"
      >
        <nav class="flex flex-1 flex-col">
          <ul class="flex flex-1 flex-col gap-y-7">
            {#if $chatStore.isLoadingChats}
              <div class="animate-pulse flex space-x-4">
                <div class="flex-1 space-y-4 py-1">
                  <div class="h-4 bg-slate-700 rounded"></div>
                  <div class="h-4 bg-slate-700 rounded"></div>
                  <div class="h-4 bg-slate-700 rounded"></div>
                </div>
              </div>
            {:else}
              <button
                on:click={void chatStore.create(`Chat #${$chatStore.chats.length + 1}`)}
                class="btn-secondary"
              >
                Create chat
              </button>
              {#if $chatStore.chats.length === 0}
                <p class="text-gray-400 text-sm leading-6 font-medium">No chats yet</p>
              {:else}
                <li>
                  <div class="text-xs font-medium leading-6 text-gray-400">Your chats</div>
                  <ul class="-mx-2 mt-2 space-y-1">
                    {#each $chatStore.chats as chat}
                      <li>
                        <!-- Current: "bg-gray-800 text-white" -->
                        <a
                          href="javascript:"
                          class="{chat.id === $chatStore.selectedChatId
                            ? 'bg-gray-800 text-white'
                            : ''} text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium"
                          on:click={() => select(chat)}
                        >
                          <span class="truncate">{chat.title}</span>

                          <button
                            on:click={void chatStore.remove(chat)}
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
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </a>
                      </li>
                    {/each}
                  </ul>
                </li>
              {/if}
            {/if}
            <li class="-mx-6 mt-auto">
              <div
                class="flex items-center gap-x-4 px-5 py-3 text-sm font-medium leading-6 text-white hover:bg-gray-800"
              >
                {#if $authStore.user.photoURL}
                  <img
                    class="h-10 w-10 rounded-full bg-gray-800"
                    src={$authStore.user.photoURL}
                    alt={$authStore.user.title}
                  />
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
                    class="feather feather-user h-10 w-10 rounded-full bg-white text-black"
                    ><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle
                      cx="12"
                      cy="7"
                      r="4"
                    /></svg
                  >
                {/if}
                <span class="sr-only">Your profile</span>
                <span aria-hidden="true">{$authStore.user.title}</span>

                <a
                  href="/"
                  class="ml-auto text-gray-400 hover:text-white"
                  on:click={authStore.signOut}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </a>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </aside>

    <div class="xl:pl-72">
      <main>
        {#if $chatStore.selectedChat}
          <div class="h-screen px-4 xl:px-10 pt-16 pb-6 xl:py-6 grid grid-rows-[1fr_auto] gap-4">
            <div
              bind:this={messagesContainer}
              class="messages-container overflow-hidden overflow-y-scroll space-y-4"
            >
              {#if $chatStore.selectedChat.messages.length}
                {#each $chatStore.selectedChat.messages as message, messageIndex}
                  <div
                    class="{message.role === 'assistant'
                      ? 'bg-gray-800/70'
                      : ''} py-2 px-3 max-w-2xl mx-auto rounded"
                  >
                    <div class="flex items-center gap-2 mb-2">
                      {#if message.role === 'user'}
                        {#if $authStore.user.photoURL}
                          <img
                            class="h-8 w-8 inline-block rounded-full"
                            src={$authStore.user.photoURL}
                            alt={$authStore.user.title}
                          />
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
                            class="feather feather-user h-8 w-8 inline-block rounded-full bg-white text-black"
                            ><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle
                              cx="12"
                              cy="7"
                              r="4"
                            /></svg
                          >
                        {/if}
                        <span>{$authStore.user.title}</span>
                      {:else}
                        <img
                          src="/favicon.svg"
                          alt="Assistant"
                          class="h-8 w-8 inline-block bg-white rounded"
                        />
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
                          $chatStore.selectedChat &&
                          chatStore.removeMessage($chatStore.selectedChat, messageIndex)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-6 w-6 text-slate-400 hover:text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div class="message">
                      {@html message.content}

                      {#if message.isFlagged}
                        <div class="mt-2 border border-red-500 text-red-500 rounded p-3">
                          ⚠️ This message was flagged as inappropriate. Please delete it and ask
                          something else.
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
                {/each}
              {:else}
                <div
                  class="mx-4 lg:mx-auto mt-20 xl:mt-12 max-w-lg text-center p-12 rounded border border-dashed border-gray-500"
                >
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
                  <h3 class="mt-2 text-sm font-medium text-gray-100">
                    Ask your question using input below
                  </h3>
                  <div class="mt-6">
                    <button on:click={focus} class="btn-secondary w-auto">
                      Focus on the input
                    </button>
                  </div>
                </div>
              {/if}
              {#if $chatStore.isCreatingMessage || $chatStore.selectedChat.isAnswering}
                <div class="animate-pulse flex space-x-4 py-2 px-3 max-w-2xl mx-auto">
                  <div class="flex-1 space-y-3 py-1">
                    <div class="h-5 bg-slate-700 rounded"></div>
                    <div class="h-5 bg-slate-700 rounded"></div>
                  </div>
                </div>
              {/if}
            </div>

            <div>
              <div class="max-w-3xl mx-auto">
                <form on:submit|preventDefault={submit} class="flex gap-2">
                  <textarea
                    autofocus
                    bind:value={message}
                    bind:this={messageInput}
                    rows="2"
                    class="input grow min-h-[40px] max-h-80"
                    placeholder="Your message"
                    disabled={$chatStore.isCreatingMessage}
                    on:keydown={e =>
                      e.key === 'Enter' &&
                      !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) &&
                      submit()}></textarea>

                  <button
                    class="btn-primary w-20 shrink-0 flex-col items-center"
                    disabled={!message || $chatStore.isCreatingMessage}
                  >
                    {#if $chatStore.isCreatingMessage}
                      Sending...
                    {:else}
                      <span>Send</span>
                    {/if}
                  </button>
                </form>
              </div>
            </div>
          </div>
        {/if}

        {#if $chatStore.chats.length === 0}
          <div
            class="mx-4 lg:mx-auto mt-20 xl:mt-12 max-w-lg text-center p-12 rounded border border-dashed border-gray-500"
          >
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
          </div>
        {/if}

        <!-- Uncomment next lines to debug state -->
        <!-- <pre>{JSON.stringify($chatStore, null, 2)}</pre> -->
        <!-- <pre>{JSON.stringify($authStore, null, 2)}</pre> -->
      </main>
    </div>
  </div>
{:else}
  <div class="flex min-h-full">
    <div
      class="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24"
    >
      <div class="mx-auto w-full max-w-sm lg:w-96">
        <div class="mt-8">
          <div>
            <div>
              <div class="mt-2 grid grid-cols-1 gap-3">
                <div>
                  <a
                    href="javascript:;"
                    on:click={authStore.signInWithGoogle}
                    class="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 hover:opacity-80 focus:outline-offset-0 transition-opacity"
                  >
                    Sign in with Google
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="relative hidden w-0 flex-1 lg:block">
      <img
        class="absolute inset-0 h-full w-full object-cover"
        src="https://picsum.photos/id/29/1400"
        alt=""
      />
    </div>
  </div>
{/if}
