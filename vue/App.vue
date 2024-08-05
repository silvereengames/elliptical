<script setup>
import { reactive, computed } from "vue";
import { socket } from '@/socket';

const stuff = reactive({
  input: "",
  username: localStorage.getItem("username") || "",
  messages: [],
  rooms: [],
  roomid: null,
  usersOnline: 0,
});

socket.off();

console.log("Connecting to server...");
socket.on("connect", () => {
  console.log("Connected to server as " + socket.id);
});

socket.on("room", (room) => {
  stuff.rooms.push(room);
});

socket.on("joined", (id) => {
  stuff.roomid = id;
});

socket.on("chat message", (msg) => {
  stuff.messages.push(msg.message);
});

socket.on("users", (msg) => {
  stuff.usersOnline = msg;
});

socket.on("clear", () => {
  stuff.rooms = [];
  stuff.messages = [];
});

socket.on("clearmessages", () => {
  stuff.messages = [];
});

const currentRoomTitle = computed(() => {
  const room = stuff.rooms.find((room) => room.roomid == stuff.roomid);
  return room ? room.title : "";
})

function onSubmit() {
  if (stuff.input) {
    socket.emit("chat message", { msg: `${stuff.username}: ${stuff.input}`, roomid: stuff.roomid });
    stuff.input = "";
  }
}
function promptUsername() {
  const username = prompt("Please enter your username");
  if (username) {
    stuff.username = username;
    localStorage.setItem("username", username);
  }
}
function promptRoom() {
  const roomTitle = prompt("Please enter a room name");
  if (roomTitle) {
    socket.emit("room", roomTitle);
  }
}
function joinRoom(room) {
  socket.emit("joinroom", room.roomid);
}
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-900 text-white p-4">
    <div class="p-4 bg-gray-800 flex justify-between items-center rounded-lg">
      <h1 class="text-xl font-bold">Elliptical v0.15</h1>
      <div class="flex items-center">
        <button @click="promptUsername" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg mr-4">{{ stuff.username ||
          'Set Username' }}</button>
        <h3 class="sticky">Users Online: {{ stuff.usersOnline }}</h3>
      </div>
    </div>
    <div class="flex flex-1 overflow-hidden mt-4">
      <div class="w-64 p-4 bg-gray-800 overflow-y-auto rounded-lg">
        <h3>Rooms</h3>
        <ul>
          <li v-for="(room, index) in stuff.rooms" :key="index" class="my-2 rounded-lg">
            <button @click="joinRoom(room)" class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg">
              {{ room.title }}
            </button>
          </li>
        </ul>
        <button @click="promptRoom" class="w-full mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg">Create
          Room</button>
        <p v-if="stuff.rooms.length === 0" class="mt-4 text-red-500">No active rooms. Please create one.</p>
      </div>
      <div v-if="stuff.roomid" class="flex-1 p-4 overflow-y-auto rounded-lg">
        <h3>Chats in {{ currentRoomTitle }}</h3>
        <ul>
          <li v-for="(message, index) in stuff.messages" :key="index">{{ message }}</li>
        </ul>
      </div>
    </div>
    <form @submit.prevent="onSubmit" class="p-4" v-if="stuff.roomid">
      <input v-model="stuff.input" autocomplete="off" placeholder="Message" required
        class="w-full px-4 py-2 bg-white text-black rounded-lg" />
      <button class="w-full mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg">Send</button>
    </form>
  </div>
</template>