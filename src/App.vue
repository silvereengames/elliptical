<script setup>
import { onMounted } from "vue";
import Admin from "@/components/Admin.vue";
import Rooms from "@/components/Rooms.vue";
import Messages from "@/components/Messages.vue";
import Loader from "@/components/Loader.vue";
import { context, path, soundsEnabled, latestMessage } from "@/assets/store";
import { notif } from "@/assets/utils";
import socket from "@/assets/socket";
import { onSubmit } from "@/assets/code.js";
import { showMain } from "@/assets/store";
import RoomJoining from "@/components/modals/roomJoining.vue";
import usernamePicker from "@/components/modals/usernamePicker.vue";
import Navbar from "@/components/Navbar.vue";
import RoomCreation from "./components/modals/roomCreation.vue";

// actual code
const sanitize = (text) =>
  text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

const messageSound = new Audio("/sounds/message.wav");

socket.off();

console.log("Connecting to server...");
socket.on("connect", () => console.log("Connected to server with id", socket.id));
socket.on("disconnect", () => {
  context.status.text = "Disconnected";
  context.status.code = 2;
  context.online = 0;
});

socket.on("connect", () => {
  context.status.text = "Connected";
  context.status.code = 0;

  context.rooms = [];

  if ("private-codes" in localStorage)
    try {
      context.codes = JSON.parse(localStorage.getItem("private-codes"));

      context.codes.forEach((code) => socket.emit("join private", code));
    } catch { }
});

socket.on("joined", (id) => {
  context.roomid = id;
  context.reports = [];
  context.messages = [];
});
socket.on("room", (room) => {
  if (room.update) {
    delete room.update;

    return (context.rooms = context.rooms.map((roomData) => {
      if (roomData.id === room.id) return room;

      return roomData;
    }));
  }

  context.rooms.push(room);

  context.rooms = context.rooms;
});

socket.on("message", (message) => {
  if (soundsEnabled && latestMessage.value !== message.message) messageSound.play();

  context.messages.push({
    id: message.msgid,
    highlight: message.highlight || false,
    msg: `<p>${sanitize(message.message)}</p>`,
    originalmsg: message.message,
  });
});

socket.on("report", (message) => {
  context.reports.push({
    id: message.msgid,
    highlight: message.highlight || false,
    msg: `<p>${sanitize(message.message)}</p>`,
    roomid: message.roomid,
  });
});

socket.on("users", (users) => (context.online = users));

socket.on("event", (event) =>
  notif(event.message, {
    expires: event?.expires || 25,
    status: event?.status || 0,
  })
);

socket.on("opentab", (target) => {
  // Security risk, should remove
  console.log("Opening", target);
  window.open(target, "_blank");
});

socket.on("delete", ({ type, id }) => {
  if (type === "room" && id) {
    context.rooms = context.rooms.filter((room) => room.id !== id);

    if (context.roomid === id) context.roomid = null;
  } else if (type === "message" && id) context.messages = context.messages.filter((message) => message.id !== id);
});

socket.on("purge", () => {
  context.roomid = null;
  context.messages = [];
  context.rooms = [];
});




onMounted(() => {
  const username = localStorage.getItem("username") || `Guest ${Math.floor(1000 + Math.random() * 9000)}`;
  localStorage.setItem("username", username);
  context.username = username;
});
</script>
<template>
  <Loader></Loader>
  <div id="main" v-if="showMain" class="fade-in">
    <RoomCreation />
    <RoomJoining />
    <usernamePicker />

    <div class="flex flex-col h-screen bg-gray-900 text-white p-4">
      <Navbar />

      <div class="flex flex-1 overflow-hidden mt-4 relative">
        <Rooms />
        <Messages />

      </div>

      <div class="p-4 mt-2 bg-gray-800 rounded-lg text-center" v-if="context.roomid && context.roomid !== 'reports'">
        <form @submit.prevent="onSubmit" class="flex items-center">
          <input v-model="context.input" autocomplete="off" placeholder="Message" required
            class="flex-grow py-2.5 px-5 text-sm font-medium rounded-lg border border-gray-400 bg-gray-600 outline-none" />
          <button class="px-5 py-2.5 ml-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold">Send</button>
        </form>
      </div>

      <Admin v-if="path === '/admin'" />
    </div>
  </div>
</template>

<style>
@keyframes pulse {
  0% {
    color: white;
  }

  50% {
    color: gray;
  }

  100% {
    color: white;
  }
}

.animate-pulse {
  animation: pulse 1s infinite;
}

.fade-out {
  transition: opacity 0.5s;
  opacity: 0;
}

.fade-in {
  transition: opacity 0.5s;
  opacity: 1;
}
</style>