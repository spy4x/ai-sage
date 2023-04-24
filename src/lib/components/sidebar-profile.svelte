<script lang="ts">
  import { authStore } from '../stores';
</script>

<div
  class="flex items-center gap-x-4 px-5 py-3 text-sm font-medium leading-6 text-white hover:bg-gray-800"
>
  {#if $authStore.user && $authStore.user.photoURL}
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
      ><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg
    >
  {/if}
  <span class="sr-only">Your profile</span>
  <span aria-hidden="true">{$authStore.user?.title || 'Loading...'}</span>

  <a href="/" class="ml-auto text-gray-400 hover:text-white" on:click={authStore.signOut}>
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
