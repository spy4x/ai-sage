<script lang="ts">
  import { authStore } from '@stores';
</script>

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
                <button
                  on:click={authStore.signInWithGoogle}
                  class="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 hover:opacity-80 focus:outline-offset-0 transition-opacity"
                >
                  Sign in with Google
                </button>
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
