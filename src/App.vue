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
    
    if (context.roomid) joinRoom(context.roomid);
});

socket.on('joined', (id) => context.roomid = id);

socket.on('room', (room) => context.rooms.push(room));

socket.on('message', ({ id, message, highlight }) => context.messages.push({
    id,
    msg: `<p ${highlight ? 'class="bg-yellow-400 rounded-md text-black"' : ''}>${sanitize(message)}</p>`
}));

socket.on('users', (msg) => context.online = msg);

socket.on('clear', () => {
    context.rooms = [];
    context.messages = [];
});

socket.on('clearmessages', () => context.messages = []);

socket.on('event', (msg) => notif(msg));

socket.on('opentab', (target) => { // Security risk, should remove
    console.log('Opening', target);
    window.open(target, '_blank');
});

socket.on('delete', ({ type, id }) => {
    if (type === 'room') {
        context.rooms = context.rooms.filter((room) => room.roomid !== id);
        
        if (context.roomid === id) context.roomid = null;
    }
    else if (type === 'message') context.messages = context.messages.filter((message) => message.id !== id);
});

socket.on('purge', () => {
    context.rooms = [];
    context.messages = [];
});

const currentRoomTitle = computed(() => {
    const room = context.rooms.find((room) => room.roomid == context.roomid);
    return room ? room.title : '';
});

const sanitize = (text) => text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const onSubmit = () => {
    if (context.input) {
        socket.emit('message', {
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
    if (context.delete) socket.emit('admin handler', {
        adminpass: context.adminpass,
        command: 'deleteroom',
        roomid: room.roomid
    });
    else socket.emit('joinroom', room.roomid);
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
                <button @click="promptUsername" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg mr-4">
                    {{ context.username || 'Set Username' }}
                </button>

                <h3 class="sticky">Users: {{ context.online }}</h3>
            </div>
        </div>

        <div class="flex flex-1 overflow-hidden mt-4 relative">
            <div class="w-64 p-4 pr-0 pb-20 bg-gray-800 rounded-lg">
                <h3 class="font-bold">Rooms</h3>

                <ul class="overflow-y-scroll h-full scrollbar-transparent" v-if="context.rooms.length !== 0">
                    <li v-for="(room, index) in context.rooms" :key="index" class="my-2 rounded-lg">
                        <button @click="joinRoom(room)" class="w-full px-4 py-2 rounded-lg" :class="room.highlight ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-blue-500 text-white hover:bg-blue-600'">
                            {{ room.title }}
                        </button>
                    </li>
                </ul>

                <div class="absolute bottom-0 left-0 right-0 p-2 w-64 bg-gray-800 rounded-lg">
                    <button @click="promptRoom" class="w-full px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg">
                        Create Room
                    </button>
                </div>

                <p v-if="context.rooms.length === 0" class="mt-4 text-gray-300 text-sm">No active rooms, create one below</p>
            </div>

            <div v-if="context.roomid" class="flex-1 p-4 overflow-y-auto rounded-lg">
                <h3 class="font-bold">Welcome to #{{ currentRoomTitle }}!</h3>

                <ul>
                    <li v-for="(message, index) in context.messages" :key="index" v-html="message.msg"
                        @click="deletemsg(message.id)"></li>
                </ul>
            </div>

            <div v-else class="flex-1 p-4 rounded-lg flex flex-col items-center justify-center text-gray-400">
                <h1>Welcome to Elliptical!</h1>
                <h3>{{ context.rooms.length === 0 ? 'Create' : 'Select' }} a room to start chatting...</h3>
            </div>
        </div>

        <div class="p-4 mt-2 bg-gray-800 rounded-lg text-center" v-if="context.roomid">
            <form @submit.prevent="onSubmit" class="flex items-center">
                <input v-model="context.input" autocomplete="off" placeholder="Message" required
                    class="flex-grow p-3 bg-white text-black rounded-lg mr-2 h-10" />
                <button class="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg h-10">Send</button>
            </form>
        </div>

        <admin v-if="path === '/admin'" />
    </div>
</template>