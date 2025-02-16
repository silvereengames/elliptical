<script setup>
import { context, path, joinRoomModal, newRoom } from "@/assets/store";
import { joinRoom, joinReports } from "@/assets/code.js";

</script>

<template>
  <div class="w-64 bg-gray-800 rounded-lg">
    <div class="p-4 overflow-y-auto overflow-x-hidden"
      :class="context.rooms.length === 0 ? '' : 'h-[calc(100%-6.5rem)]'">
      <button v-if="path === '/admin'" class="w-full px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
        @click="joinReports">Reports</button>
      <details open v-if="context.privateRooms.length !== 0">
        <summary class="font-bold cursor-pointer">
          Private Rooms
        </summary>

        <ul class="h-full scrollbar-transparent">
          <li v-for="(room, index) in context.privateRooms" :key="index" class="my-2 rounded-lg">
            <button @click="joinRoom(room)" class="w-full px-4 py-2 rounded-lg"
              :class="room.highlight ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-blue-500 text-white hover:bg-blue-600'">
              {{ room.title }}
            </button>
          </li>
        </ul>
      </details>

      <details :open="context.publicRooms.length !== 0">
        <summary class="font-bold cursor-pointer">
          Public Rooms
        </summary>

        <ul class="h-full scrollbar-transparent" v-if="context.publicRooms.length !== 0">
          <li v-for="(room, index) in context.publicRooms" :key="index" class="my-2 rounded-lg">
            <button @click="joinRoom(room)" class="w-full px-4 py-2 rounded-lg"
              :class="room.highlight ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-blue-500 text-white hover:bg-blue-600'">
              {{ room.title }}
            </button>
          </li>
        </ul>
      </details>
    </div>

    <p v-if="context.rooms.length === 0" class="ml-4 text-gray-300 text-sm">
      No active rooms, create one below
    </p>

    <div class="absolute bottom-0 left-0 right-0 p-2 w-64 bg-gray-800 rounded-lg">
      <button @click="joinRoomModal.open = true"
        class="w-full px-5 py-2.5 mb-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-sm font-bold">
        Join Room
      </button>

      <button @click="newRoom.open = true"
        class="w-full px-5 py-2.5 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-bold">
        Create Room
      </button>
    </div>
  </div>
</template>