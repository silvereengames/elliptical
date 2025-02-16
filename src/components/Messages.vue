<script setup>
import { computed } from 'vue';
import DOMPurify from 'dompurify';
import { context } from "@/assets/store";
import { deletemsg, gotomsg, reportmsg, copyCode, leave } from "@/assets/code.js";

const currentRoomTitle = computed(() => {
  const room = context.rooms.find((room) => room.id == context.roomid)
  return room ? room.title : ""
})

</script>

<template>
  <div v-if="context.roomid && context.roomid !== 'reports'" class="flex-1 p-4 overflow-y-auto rounded-lg">
    <div v-if="context.rooms.find(({ id }) => context.roomid === id).private"
      class="p-4 px-6 top-0 right-0 bg-gray-800 flex justify-between items-center rounded-lg absolute">
      <button @click="copyCode" class="px-5 py-2.5 mr-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold">
        {{context.rooms.find(({ id }) => context.roomid === id).code}}
      </button>

      <span class="h-10 mr-3 border-r border-white-100"></span>

      <button @click="leave" class="px-5 py-2.5 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-bold">
        Leave Room
      </button>
    </div>

    <h3 class="font-bold">Welcome to #{{ currentRoomTitle }}</h3>

    <ul>
      <li v-for="(message, index) in context.messages" :key="index"
        :class="message.highlight ? 'highlight' + ((context.messages[index + 1]?.highlight ? ' below' : '') + (context.messages[index - 1]?.highlight ? ' above' : '')) : ''">
        <div class="flex items-center justify-between m-2">
          <div v-html="DOMPurify.sanitize(message.msg)" @click="deletemsg(message.id)" :id="message.id"></div>
          <button @click="reportmsg({ id: message.id, msg: message.originalmsg })"
            class="p-1 bg-red-600 rounded-lg">Report</button>
        </div>
      </li>
    </ul>
  </div>

  <div v-if="context.roomid === 'reports'">
    <ul>
      <li v-for="(message, index) in context.reports" :key="index"
        :class="message.highlight ? 'highlight' + ((context.messages[index + 1]?.highlight ? ' below' : '') + (context.messages[index - 1]?.highlight ? ' above' : '')) : ''">
        <div class="flex items-center justify-between m-2">
          <div v-html="DOMPurify.sanitize(message.msg)" @click="gotomsg(message.roomid, message.id)"></div>
        </div>
      </li>
    </ul>
  </div>

  <div v-if="!context.roomid" class="flex-1 p-4 rounded-lg flex flex-col items-center justify-center text-gray-400">
    <h1>Welcome to Elliptical</h1>
    <h3>{{ context.rooms.length === 0 ? 'Create' : 'Select' }} a room to start chatting...</h3>
  </div>
</template>