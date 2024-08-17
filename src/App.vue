<script setup>
import { ref, computed, onMounted } from 'vue';

import admin from '@/components/Admin.vue';
import { context } from '@/store';
import { notif } from '@/utils';
import socket from '@/socket';

const path = location.pathname;

socket.off();

console.log('Connecting to server...');
socket.on('connect', () => console.log('Connected to server with id', socket.id));
socket.on('disconnect', () => {
    context.status.text = 'Disconnected';
    context.status.code = 2;
    context.online = 0;
});

socket.on('connect', () => {
    context.status.text = 'Connected';
    context.status.code = 0;

    context.messages = [];
    context.rooms = [];
});

socket.on('joined', (id) => context.roomid = id);

socket.on('room', (room) => {
    if (room.update) {
        delete room.update

        return context.rooms = context.rooms.map((roomData) => {
            if (roomData.id === room.id) return room;

            return roomData;
        });
    }

    context.rooms.push(room);
});

socket.on('message', (message) => context.messages.push({
    id: message.id,
    highlight: message.highlight || false,
    msg: `<p>${sanitize(message.message)}</p>`
}));

socket.on('users', (users) => context.online = users);

socket.on('event', (event) => notif(event.message, {
    expires: event?.expires || 25,
    status: event?.status || 0
}));

socket.on('opentab', (target) => { // Security risk, should remove
    console.log('Opening', target);
    window.open(target, '_blank');
});

socket.on('delete', ({ type, id }) => {
    if (type === 'room' && id) {
        context.rooms = context.rooms.filter((room) => room.id !== id);

        if (context.roomid === id) context.roomid = null;
    }
    else if (type === 'message' && id) context.messages = context.messages.filter((message) => message.id !== id);
});

socket.on('purge', () => {
    context.messages = [];
    context.rooms = [];
});

const currentRoomTitle = computed(() => {
    const room = context.rooms.find((room) => room.id == context.roomid);
    return room ? room.title : '';
});

const sanitize = (text) => text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const onSubmit = () => {
    if (context.input) {
        if (context.highlight) socket.emit('admin handler', {
            adminpass: context.adminpass,
            command: 'highlight',
            roomid: context.roomid,
            message: `${context.username}: ${context.input}`
        });
        else socket.emit('message', {
            username: context.username,
            message: `${context.username}: ${context.input}`,
            roomid: context.roomid
        });

        context.input = '';
    }
}

const promptUsername = () => {
    const username = prompt('Please enter your username');

    if (username) context.username = username;

    localStorage.setItem('username', context.username);
}

const promptRoom = () => {
    const roomTitle = prompt('Please enter a room name');

    if (roomTitle) socket.emit('room', roomTitle);
}

const joinRoom = (room) => {
    if (context.delete) return socket.emit('admin handler', {
        adminpass: context.adminpass,
        command: 'deleteroom',
        roomid: room.id
    });

    if (context.highlight) return socket.emit('admin handler', {
        adminpass: context.adminpass,
        command: 'highlight',
        roomid: room.id
    });

    if (room.id === context.roomid) return;

    context.messages = [];

    socket.emit('joinroom', room.id);
}

const deletemsg = (msgid) => {
    if (context.delete) socket.emit('admin handler', {
        adminpass: context.adminpass,
        command: 'deletemsg',
        msgid: msgid,
        roomid: context.roomid
    });
}

onMounted(() => {
    const username = localStorage.getItem('username') || `Guest ${Math.floor(1000 + Math.random() * 9000)}`;

    localStorage.setItem('username', username);

    context.username = username;
});
</script>

<template>
    <!--<div id="default-modal" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 bottom-0 z-50 flex justify-center items-center w-full md:inset-0 bg bg-gray-600/50">
        <div class="relative w-full max-w-2xl max-h-full bg-gray-800 rounded-lg shadow p-6 text-white text-center">
            <h3 class="text-xl font-semibold">
                Create a Room
            </h3>

            <div class="py-4 font-semibold text-gray-400 align-middle">
                <input placeholder="Room name" type="text" maxlength="25" class="w-80 py-2.5 px-5 m-1 text-sm font-medium rounded-lg border border-gray-400 bg-gray-600 outline-none text-white">
                
                <div class="flex justify-center items-center mt-2">
                    <label>Private</label>
                    
                    <span :class="{
                        'bg-blue-500': context.highlight,
                        'bg-gray-600': !context.highlight
                    }" class="relative inline-block w-12 h-6 ml-2 rounded-md transition-colors duration-300 ease-in-out cursor-pointer" @click="toggleHighlight">
                        <span :class="{
                                'translate-x-6_5': context.highlight,
                                'translate-x-0.5': !context.highlight
                            }" class="absolute left-0 top-0 w-5 h-5 bg-white rounded-md shadow transform transition-transform duration-300 ease-in-out" style="margin-top: 2px;"></span>
                    </span>
                </div>
            </div>

            <div class="flex justify-center">
                <button data-modal-hide="default-modal" type="button" class="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold">Create</button>
                <button data-modal-hide="default-modal" type="button" class="py-2.5 px-5 ms-3 text-sm font-medium rounded-lg bg-gray-600 hover:bg-gray-700">Cancel</button>
            </div>
        </div>
    </div>-->
    
    <div class="flex flex-col h-screen bg-gray-900 text-white p-4">
        <div class="p-4 px-6 bg-gray-800 flex justify-between items-center rounded-lg">
            <h1 class="text-xl font-bold">
                Elliptical v0.15

                <span class="px-2 py-1 rounded-lg text-xs ml-1" :class="{
                    'bg-red-500': context.status.code === 2,
                    'bg-yellow-500': context.status.code === 1,
                    'bg-green-500': context.status.code === 0
                }">{{ context.status.text }}</span>
            </h1>

            <h1 class="px-4 py-2 text-xm font-bold p-1 rounded-md" :class="{
                'bg-red-500': context.notif.status === 2,
                'bg-yellow-500': context.notif.status === 1,
                'bg-blue-500': context.notif.status === 0
            }" v-if="context.notif.showing">{{ context.notif.text }}</h1>

            <div class="flex items-center">
                <button @click="promptUsername" class="w-full px-5 py-2.5 mr-4 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold">
                    {{ context.username || 'Set Username' }}
                </button>

                <h3 class="text-nowrap">Users: {{ context.online }}</h3>
            </div>
        </div>

        <div class="flex flex-1 overflow-hidden mt-4 relative">
            <div class="w-64 p-4 pr-0 pb-32 bg-gray-800 rounded-lg">
                <h3 class="font-bold">Rooms</h3>

                <ul class="overflow-y-scroll h-full scrollbar-transparent" v-if="context.rooms.length !== 0">
                    <li v-for="(room, index) in context.rooms" :key="index" class="my-2 rounded-lg">
                        <button @click="joinRoom(room)" class="w-full px-4 py-2 rounded-lg" :class="room.highlight ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-blue-500 text-white hover:bg-blue-600'">
                            {{ room.title }}
                        </button>
                    </li>
                </ul>

                <div class="absolute bottom-0 left-0 right-0 p-2 w-64 bg-gray-800 rounded-lg">
                    <button class="w-full px-5 py-2.5 mb-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-sm font-bold">
                        Join Room
                    </button>
                    
                    <button @click="promptRoom" class="w-full px-5 py-2.5 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-bold">
                        Create Room
                    </button>
                </div>

                <p v-if="context.rooms.length === 0" class="mt-4 text-gray-300 text-sm">
                    No active rooms, create one below
                </p>
            </div>

            <div v-if="context.roomid" class="flex-1 p-4 overflow-y-auto rounded-lg">
                <h3 class="font-bold">Welcome to #{{ currentRoomTitle }}</h3>

                <ul>
                    <li v-for="(message, index) in context.messages" :key="index" :class="message.highlight ? 'highlight' + ((context.messages[index + 1]?.highlight ? ' below' : '') + (context.messages[index - 1]?.highlight ? ' above' : '')) : ''" v-html="message.msg" @click="deletemsg(message.id)"></li>
                </ul>
            </div>

            <div v-else class="flex-1 p-4 rounded-lg flex flex-col items-center justify-center text-gray-400">
                <h1>Welcome to Elliptical!</h1>
                <h3>{{ context.rooms.length === 0 ? 'Create' : 'Select' }} a room to start chatting...</h3>
            </div>
        </div>

        <div class="p-4 mt-2 bg-gray-800 rounded-lg text-center" v-if="context.roomid">
            <form @submit.prevent="onSubmit" class="flex items-center">
                <input v-model="context.input" autocomplete="off" placeholder="Message" required class="flex-grow py-2.5 px-5 text-sm font-medium rounded-lg border border-gray-400 bg-gray-600 outline-none" />
                <button class="px-5 py-2.5 ml-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold">Send</button>
            </form>
        </div>

        <admin v-if="path === '/admin'" />
    </div>
</template>