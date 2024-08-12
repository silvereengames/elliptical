<script setup>
import { socket } from '@/socket';
import { stuff } from "@/store";

function adminhandler(cmd) {
  socket.emit('admin handler', { adminpass: stuff.adminpass, command: cmd })
}
function highlight() {
  socket.emit('admin handler', { adminpass: stuff.adminpass, command: 'highlight', roomid: stuff.roomid, data: { username: stuff.username, message: stuff.command } })
}
function passchange() {
  socket.emit('passchange', { adminpass: stuff.adminpass, newpass: stuff.command })
}

function toggleSwitch() {
  stuff.delete = !stuff.delete;
}
</script>

<template>
  <div class="p-2 mt-2 bg-gray-800 rounded-lg text-center">
    <div class="flex justify-center">
      <form @submit.prevent="adminhandler(stuff.command)">
        <input placeholder="Admin Password" type="password" class="px-4 py-2 bg-white text-black rounded-lg m-1 w-64"
          required v-model="stuff.adminpass">
        <input placeholder="Admin command" type="text" autocomplete="off"
          class="px-4 py-2 bg-white text-black rounded-lg m-1 w-80" required v-model="stuff.command">
        <input class="m-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg" type="submit">
      </form>
    </div>
    <p>Highlight submits from the <span style="color: rgb(0, 140, 255);">Admin command </span>box</p>
    <h2 class="text-xl">Quick Access:</h2>
    <div class="flex justify-center">
      <button class="w-24 px-4 py-2 m-1 bg-blue-500 hover:bg-blue-600 rounded-lg"
        @click="adminhandler('lockall')">Lock</button>
      <button class="w-24 px-4 py-2 m-1 bg-blue-500 hover:bg-blue-600 rounded-lg"
        @click="adminhandler('unlockall')">Unlock</button>
      <button class="w-38 px-4 py-2 m-1 bg-blue-500 hover:bg-blue-600 rounded-lg" @click="adminhandler('purge')">Purge
        Rooms</button>
      <button class="w-24 px-4 py-2 m-1 bg-blue-500 hover:bg-blue-600 rounded-lg"
        @click="highlight()">Highlight</button>
      <button class="w-38 px-4 py-2 m-1 bg-blue-500 hover:bg-blue-600 rounded-lg" @click="passchange()">Change
        Password</button>
      <div class="flex flex-col items-center">
        <label>Delete Mode:</label>
        <span :class="{ 'bg-green-500': stuff.delete, 'bg-red-500': !stuff.delete }"
          class="relative inline-block w-12 h-6 rounded-full transition-colors duration-300 ease-in-out cursor-pointer"
          @click="toggleSwitch">
          <span :class="{ 'translate-x-6': stuff.delete, 'translate-x-0': !stuff.delete }"
            class="absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300 ease-in-out"></span>
        </span>
      </div>
    </div>

    <p>Default password is <span style="color: rgb(0, 140, 255);">changeme</span>
      to change the password enter the current admin password into <span style="color: rgb(0, 140, 255);">Admin
        Password</span>
      put the new one in <span style="color: rgb(0, 140, 255);">Admin command</span>
      then click <span style="color: rgb(0, 140, 255);">Change Password</span></p>
  </div>
</template>