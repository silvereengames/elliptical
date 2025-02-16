<script setup>
import { newRoom } from "@/assets/store";
import { togglePrivate, createRoom } from "@/assets/code.js";
</script>

<template>
  <!--Room creation modal-->
  <div v-if="newRoom.open"
    class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 bottom-0 z-40 flex justify-center items-center w-full md:inset-0 bg bg-gray-600/50">
    <div class="relative w-full max-w-2xl max-h-full bg-gray-800 rounded-lg shadow p-6 text-white text-center">
      <h3 class="text-xl font-semibold">
        Create a Room
      </h3>
      <div class="py-4 font-semibold text-gray-400 align-middle">
        <input placeholder="Room name" type="text" maxlength="25"
          class="w-80 py-2.5 px-5 m-1 text-sm font-medium rounded-lg border border-gray-400 bg-gray-600 outline-none text-white"
          v-model="newRoom.title" />
        <div class="flex justify-center items-center mt-2 mb-1">
          <label>Private</label>
          <span :class="{
            'bg-blue-500': newRoom.private,
            'bg-gray-600': !newRoom.private
          }"
            class="relative inline-block w-12 h-6 ml-2 rounded-md transition-colors duration-300 ease-in-out cursor-pointer"
            @click="togglePrivate">
            <span :class="{
              'translate-x-6_5': newRoom.private,
              'translate-x-0.5': !newRoom.private
            }"
              class="absolute left-0 top-0 w-5 h-5 bg-white rounded-md shadow transform transition-transform duration-300 ease-in-out"
              style="margin-top: 2px;"></span>
          </span>
        </div>
        <small v-if="newRoom.private" class="font-normal">
          Private rooms will be deleted after 14 days of inactivity
        </small>
      </div>
      <div class="flex justify-center">
        <button data-modal-hide="default-modal" type="button"
          class="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold"
          @click="createRoom">Create</button>
        <button data-modal-hide="default-modal" type="button"
          class="py-2.5 px-5 ms-3 text-sm font-medium rounded-lg bg-gray-600 hover:bg-gray-700"
          @click="newRoom.private = false; newRoom.open = false; newRoom.title = '';">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>