<script setup>
import { context, usernameModal } from "@/assets/store";

const setUsername = () => {
  if (!usernameModal.username) return

  localStorage.setItem("username", usernameModal.username)

  context.username = usernameModal.username
  usernameModal.open = false
}
</script>

<template>
  <!--Username picker modal-->
  <div v-if="usernameModal.open"
    class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 bottom-0 z-40 flex justify-center items-center w-full md:inset-0 bg bg-gray-600/50">
    <div class="relative w-full max-w-2xl max-h-full bg-gray-800 rounded-lg shadow p-6 text-white text-center">
      <h3 class="text-xl font-semibold">
        Pick a Username
      </h3>
      <div class="py-4 font-semibold text-gray-400 align-middle">
        <input placeholder="Username" type="text"
          class="w-80 py-2.5 px-5 m-1 text-sm font-medium rounded-lg border border-gray-400 bg-gray-600 outline-none text-white"
          v-model="usernameModal.username" />
      </div>
      <div class="flex justify-center">
        <button data-modal-hide="default-modal" type="button"
          class="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold"
          @click="setUsername">Save</button>
        <button data-modal-hide="default-modal" type="button"
          class="py-2.5 px-5 ms-3 text-sm font-medium rounded-lg bg-gray-600 hover:bg-gray-700"
          @click="usernameModal.open = false; usernameModal.username = context.username;">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>