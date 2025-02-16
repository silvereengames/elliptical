<script setup>
import { context, usernameModal, soundsEnabled } from "@/assets/store";

const toggleSounds = () => {
  soundsEnabled.value = !soundsEnabled.value
  localStorage.setItem("sounds", soundsEnabled)
}

</script>

<template>
  <div class="p-4 px-6 bg-gray-800 flex justify-between items-center rounded-lg">
    <h1 class="text-xl font-bold">
      Elliptical v0.15
      <span class="px-2 py-1 rounded-lg text-xs ml-1" :class="{
        'bg-red-500': context.status.code === 2,
        'bg-yellow-500': context.status.code === 1,
        'bg-green-500': context.status.code === 0
      }">
        {{ context.status.text }}
      </span>
    </h1>
    <h1 class="px-4 py-2 text-xm font-bold p-1 rounded-md z-50" :class="{
      'bg-red-500': context.notif.status === 2,
      'bg-yellow-500': context.notif.status === 1,
      'bg-blue-500': context.notif.status === 0
    }" v-if="context.notif.showing">
      {{ context.notif.text }}
    </h1>

    <div class="flex items-center">
      <button @click="toggleSounds" class="h-10 px-4 mr-2 rounded-lg font-bold"
        :class="soundsEnabled ? ' bg-green-500 hover:bg-green-600' : ' bg-red-500 hover:bg-red-600'"
        :title="soundsEnabled ? 'Sounds enabled' : 'Sounds disabled'">
        <img :src="`/icons/volume${soundsEnabled ? '' : '-muted'}.svg`" class="h-10" />
      </button>

      <button @click="usernameModal.open = true"
        class="w-full px-5 py-2.5 mr-4 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold">
        {{ context.username || 'Set Username' }}
      </button>

      <h3 class="text-nowrap">Users: {{ context.online }}</h3>
    </div>
  </div>
</template>