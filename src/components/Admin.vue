<script setup>
import { notif, hideNotif } from "@/assets/utils"
import { context } from "@/assets/store"
import socket from "@/assets/socket"

const adminhandler = (command) =>
  socket.emit("admin handler", {
    adminpass: context.adminpass,
    command,
  })

const updateMaxRooms = () =>
  socket.emit("updateMaxRooms", {
    adminpass: context.adminpass,
    maxRooms: context.maxRooms,
  })

const passchange = () =>
  socket.emit("passchange", {
    adminpass: context.adminpass,
    newpass: context.command,
  })

const toggleHighlight = () => {
  context.highlight = !context.highlight

  if (context.highlight)
    notif(
      "All messages sent will be highlighted, click on a room to highlight it"
    )
}

const toggleZap = () => {
  context.delete = !context.delete

  if (context.delete)
    notif("Click on a room or message to delete it", {
      expires: 0,
      status: 1,
    })
  else hideNotif()
}
</script>

<template>
  <div class="p-2 mt-2 bg-gray-800 rounded-lg text-center">
    <div class="flex justify-center">
      <form @submit.prevent="adminhandler(context.command)">
        <input
          placeholder="Admin Password"
          type="password"
          class="w-64 py-2.5 px-5 m-1 text-sm font-medium rounded-lg border border-gray-400 bg-gray-600 outline-none"
          required
          v-model="context.adminpass"
        />
        <input
          placeholder="Admin command"
          type="text"
          autocomplete="off"
          class="w-80 py-2.5 px-5 m-1 text-sm font-medium rounded-lg border border-gray-400 bg-gray-600 outline-none"
          required
          v-model="context.command"
        />
        <button
          class="m-1 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold"
          type="submit"
        >
          Submit
        </button>
      </form>
    </div>

    <div class="flex justify-center">
      <input
        v-model="context.maxRooms"
        type="number"
        min="1"
        class="py-2.5 px-5 m-1 text-sm font-medium rounded-lg border border-gray-400 bg-gray-600 outline-none"
        placeholder="Max rooms"
      />
      <button
        @click="updateMaxRooms"
        class="m-1 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold"
      >
        Set Max Rooms
      </button>
    </div>

    <h2 class="text-xl">Quick Access:</h2>
    <div class="flex justify-center">
      <button
        class="w-24 m-1 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold"
        @click="adminhandler('lockall')"
      >
        Lock
      </button>
      <button
        class="w-24 m-1 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold"
        @click="adminhandler('unlockall')"
      >
        Unlock
      </button>
      <button
        class="w-38 m-1 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold"
        @click="adminhandler('purge')"
      >
        Purge Rooms
      </button>
      <button
        class="w-38 m-1 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold"
        @click="passchange()"
      >
        Change Password
      </button>

      <div class="flex items-center">
        <label class="m-1">Highlight:</label>

        <span
          :class="{
            'bg-blue-500': context.highlight,
            'bg-gray-600': !context.highlight,
          }"
          class="relative inline-block w-12 h-6 rounded-md transition-colors duration-300 ease-in-out cursor-pointer"
          @click="toggleHighlight"
        >
          <span
            :class="{
              'translate-x-6_5': context.highlight,
              'translate-x-0.5': !context.highlight,
            }"
            class="absolute left-0 top-0 w-5 h-5 bg-white rounded-md shadow transform transition-transform duration-300 ease-in-out"
            style="margin-top: 2px"
          ></span>
        </span>
      </div>

      <div class="flex items-center">
        <label class="m-1">Zap mode:</label>

        <span
          :class="{
            'bg-blue-500': context.delete,
            'bg-gray-600': !context.delete,
          }"
          class="relative inline-block w-12 h-6 rounded-md transition-colors duration-300 ease-in-out cursor-pointer"
          @click="toggleZap"
        >
          <span
            :class="{
              'translate-x-6_5': context.delete,
              'translate-x-0.5': !context.delete,
            }"
            class="absolute left-0 top-0 w-5 h-5 bg-white rounded-md shadow transform transition-transform duration-300 ease-in-out"
            style="margin-top: 2px"
          ></span>
        </span>
      </div>
    </div>

    <p>
      Default password is
      <span style="color: rgb(0, 140, 255)">changeme</span> to change the
      password enter the current admin password into
      <span style="color: rgb(0, 140, 255)">Admin Password</span> put the new
      one in <span style="color: rgb(0, 140, 255)">Admin command</span> then
      click <span style="color: rgb(0, 140, 255)">Change Password</span>
    </p>
  </div>
</template>
