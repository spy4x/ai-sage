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
          <p class="font-bold">
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
              <li class:font-bold={chat.id === $chatStore.selectedChatId}>
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
          <p><span class="font-bold">{message.role}</span>: {message.content}</p>
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
  <p>Not logged in</p>
  <!-- Sign in with google button -->
  <button on:click={authStore.signInWithGoogle} class="border bg-slate-200 p-3"
    >Sign in with Google</button
  >
{/if}
