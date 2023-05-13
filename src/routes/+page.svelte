<script lang="ts">
  import { SignIn, NoChats, ChatList, Chat } from '$lib/components';
  import { authStore, chatStore, menuStore, type Chat as ChatType } from '$lib/stores';

  function select(chat: ChatType) {
    chatStore.select(chat.id);
    focus();
  }

  async function create() {
    await chatStore.create();
    focus();
  }
</script>

{#if $authStore.user || $authStore.wasAuthenticated}
  <!-- #region Mobile menu-->
  <div class="xl:hidden absolute top-0 inset-x-0 z-20 bg-gray-900 border-b border-white/5">
    <div class="flex items-center pr-4">
      <button on:click={() => menuStore.toggle()} type="button" class="p-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <button
        on:click={() => {
          void chatStore.create(`Chat #${$chatStore.chats.length + 1}`);
          menuStore.toggle(false);
        }}
        type="button"
        class="btn-secondary ml-auto w-auto px-8">Create new chat</button
      >
    </div>
  </div>
  <!-- #endregion Mobile menu-->

  <aside
    class="{$menuStore.isMobileMenuOpen
      ? 'fixed inset-0 z-10 bg-gray-900 pt-16 h-dscreen flex flex-col'
      : 'hidden'}
    xl:p-0 xl:bg-transparent xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-72 xl:flex-col"
  >
    <div
      class="h-full flex-1 flex flex-col pt-5 gap-y-5 overflow-y-auto bg-black/10 px-4 ring-1 ring-white/5"
    >
      <nav class="flex flex-1 flex-col">
        <ChatList on:select={e => select(e.detail.chat)} />
      </nav>
    </div>
  </aside>

  <div class="xl:pl-72">
    <main>
      {#if !$chatStore.chats.length}
        <NoChats on:create={create} />
      {/if}

      <Chat />

      <!-- Uncomment next lines to debug state -->
      <!-- <pre>{JSON.stringify($chatStore, null, 2)}</pre> -->
      <!-- <pre>{JSON.stringify($authStore, null, 2)}</pre> -->
    </main>
  </div>
{:else}
  <SignIn />
{/if}
