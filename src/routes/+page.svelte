<script lang="ts">
  import { authStore } from '$lib/client/auth.store';
  import { chatStore } from '$lib/client/chat.store';

  let message = '';
</script>

{#if $authStore.user}
  <div class="container flex gap-6">
    <!-- #region List of chats -->
    <aside class="border-r-2 h-full p-6">
      <!-- display user data from authStore - photoURL, display name || email || id -->
      <div class="flex items-center gap-4">
        <img
          src={$authStore.user.photoURL || '/icons/user.svg'}
          alt={$authStore.user.title}
          class="w-12 h-12 rounded-full"
        />
        <div>
          <p class="font-medium">
            {$authStore.user.title}
          </p>
        </div>
      </div>
      <button on:click={authStore.signOut} class="border bg-slate-200 px-3">Sign out</button>

      <h2 class="text-2xl">Chats</h2>
      {#if $chatStore.isLoadingChats}
        <p>Loading...</p>
      {:else}
        <button
          on:click={void chatStore.create(`Chat #${$chatStore.chats.length + 1}`)}
          class="border bg-green-700 px-3 text-white"
        >
          Create chat
        </button>
        {#if $chatStore.chats.length === 0}
          <p>No chats yet</p>
        {:else}
          <ul>
            {#each $chatStore.chats as chat}
              <li class:font-medium={chat.id === $chatStore.selectedChatId}>
                <a href="javascript:;" class="underline" on:click={() => chatStore.select(chat.id)}>
                  {chat.title}
                </a>
                <button on:click={void chatStore.remove(chat)} class="border px-2 bg-red-400"
                  >x</button
                >
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    </aside>
    <!-- #endregion -->

    <!-- #region Selected chat -->
    <main>
      {#if $chatStore.selectedChat}
        <button on:click={() => chatStore.select(undefined)} class="bg-gray-400"
          >DE-SELECT this chat</button
        >

        {#each $chatStore.selectedChat.messages as message}
          <p><span class="font-medium">{message.role}</span>: {message.content}</p>
        {/each}
        {#if $chatStore.isCreatingMessage || $chatStore.selectedChat.isAnswering}
          <p>...awaiting answer...</p>
        {/if}
        <form
          on:submit|preventDefault={() => {
            $chatStore.selectedChatId && chatStore.message($chatStore.selectedChatId, message);
            message = '';
          }}
        >
          <input type="text" bind:value={message} class="border-4" placeholder="Your message" />
        </form>
      {:else}
        <p>Select chat on the left or create one</p>
        <button
          on:click={void chatStore.create(`Chat #${$chatStore.chats.length + 1}`)}
          class="border bg-green-700 px-3 text-white"
        >
          Create chat
        </button>
      {/if}
      <!-- #endregion -->

      <!-- Uncomment next lines to debug state -->
      <!-- <pre>{JSON.stringify($chatStore, null, 2)}</pre> -->
      <!-- <pre>{JSON.stringify($authStore, null, 2)}</pre> -->
    </main>
  </div>
{:else}
  <div class="flex min-h-full">
    <div class="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
      <div class="mx-auto w-full max-w-sm lg:w-96">
        <div>
          <h2 class="mt-6 text-3xl font-medium tracking-tight">Sign in to your account</h2>
        </div>

        <div class="mt-8">
          <div>
            <div>
              <p class="text-sm font-medium leading-6">Sign in with</p>

              <div class="mt-2 grid grid-cols-1 gap-3">
                <div>
                  <!-- Sign in with google button -->
                  <a href="#" on:click={authStore.signInWithGoogle}
                     class="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 hover:opacity-80 focus:outline-offset-0 transition-opacity">
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
      <img class="absolute inset-0 h-full w-full object-cover" src="https://picsum.photos/id/29/1400" alt="">
    </div>
  </div>
{/if}
