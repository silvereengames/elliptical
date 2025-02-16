<script setup>
import socket from "@/assets/socket";
import { context, joinRoomModal } from "@/assets/store.js";

const joinPrivateRoom = () => {
  if (joinRoomModal.code.length !== 5)
    return notif("The code is 5 characters long", {
      status: 2,
    })

  if (context.codes.includes(joinRoomModal.code))
    return notif("You are already in that room")

  socket.emit("join private", joinRoomModal.code)

  try {
    const codes = JSON.parse(localStorage.getItem("private-codes"))

    codes.push(joinRoomModal.code)

    context.codes = codes
    localStorage.setItem("private-codes", JSON.stringify(codes))
  } catch {
    context.codes = [joinRoomModal.code]
    localStorage.setItem("private-codes", JSON.stringify([joinRoomModal.code]))
  }

  joinRoomModal.open = false
  joinRoomModal.code = ""
}
</script>
<template>
  <!--Room joining modal-->
  <div v-if="joinRoomModal.open"
    class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 bottom-0 z-40 flex justify-center items-center w-full md:inset-0 bg bg-gray-600/50">
    <div class="relative w-full max-w-2xl max-h-full bg-gray-800 rounded-lg shadow p-6 text-white text-center">
      <h3 class="text-xl font-semibold">
        Join a Private Room
      </h3>
      <div class="py-4 font-semibold text-gray-400 align-middle">
        <input placeholder="Room code" type="text" minlength="5" maxlength="5"
          class="w-80 py-2.5 px-5 m-1 text-sm font-medium rounded-lg border border-gray-400 bg-gray-600 outline-none text-white"
          v-model="joinRoomModal.code" />
      </div>
      <div class="flex justify-center">
        <button data-modal-hide="default-modal" type="button"
          class="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold"
          @click="joinPrivateRoom">Join</button>
        <button data-modal-hide="default-modal" type="button"
          class="py-2.5 px-5 ms-3 text-sm font-medium rounded-lg bg-gray-600 hover:bg-gray-700"
          @click="joinRoomModal.open = false; joinRoomModal.code = '';">Cancel</button>
      </div>
    </div>
  </div>
</template>