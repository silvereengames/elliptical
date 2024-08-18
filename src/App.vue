<script setup>
import { ref, computed, reactive, onMounted } from 'vue';

import admin from '@/components/Admin.vue';
import { context } from '@/store';
import { notif } from '@/utils';
import socket from '@/socket';

const path = location.pathname;
const newRoom = reactive({
    open: false,
    title: '',
    private: false
});
const joinRoomModal = reactive({
    open: false,
    code: ''
});
const usernameModal = reactive({
    open: false,
    username: context.username
});

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
    
    if ('private-codes' in localStorage) try {
        context.codes = JSON.parse(localStorage.getItem('private-codes'));
        
        context.codes.forEach((code) => socket.emit('join private', code));
    } catch {}
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
    
    context.rooms = context.rooms;
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

    socket.emit('join', room.id);
}

const deletemsg = (msgid) => {
    if (context.delete) socket.emit('admin handler', {
        adminpass: context.adminpass,
        command: 'deletemsg',
        msgid: msgid,
        roomid: context.roomid
    });
}

const togglePrivate = () => newRoom.private = !newRoom.private;
const createRoom = () => {    
    if (!newRoom.title) return notif('A room title was not provided', {
        status: 2
    });
    
    const code = (Math.random() + 1).toString(36).substring(7);
    
    socket.emit('room', {
        title: newRoom.title,
        private: newRoom.private,
        ...(newRoom.private ? {
            code
        } : {})
    });
    
    if (newRoom.private && 'private-codes' in localStorage) try {
        const codes = JSON.parse(localStorage.getItem('private-codes'));
        
        codes.push(code);
        
        context.codes = codes;
        localStorage.setItem('private-codes', JSON.stringify(codes));
    } catch {
        context.codes = [code];
        localStorage.setItem('private-codes', JSON.stringify([code]));
    }
    
    newRoom.private = false;
    newRoom.open = false;
    newRoom.title = '';
}

const joinPrivateRoom = () => {
    if (joinRoomModal.code.length !== 5) return notif('The code is 5 characters long', {
        status: 2
    });
    
    console.log(context.codes.includes(joinRoomModal.code));
    
    if (context.codes.includes(joinRoomModal.code)) return notif('You are already in that room');
    
    socket.emit('join private', joinRoomModal.code);
    
    try {
        const codes = JSON.parse(localStorage.getItem('private-codes'));
        
        codes.push(joinRoomModal.code);
        
        context.codes = codes;
        localStorage.setItem('private-codes', JSON.stringify(codes));
    } catch {
        context.codes = [joinRoomModal.code];
        localStorage.setItem('private-codes', JSON.stringify([joinRoomModal.code]));
    }
    
    joinRoomModal.open = false;
    joinRoomModal.code = '';
}

const setUsername = () => {
    if (!usernameModal.username) return;
    
    localStorage.setItem('username', usernameModal.username);
    
    context.username = usernameModal.username;
    usernameModal.open = false;
}

onMounted(() => {
    const username = localStorage.getItem('username') || `Guest ${Math.floor(1000 + Math.random() * 9000)}`;

    localStorage.setItem('username', username);

    context.username = username;
});
</script>

<template>
    <!--Room creation modal-->
    <div v-if="newRoom.open" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 bottom-0 z-40 flex justify-center items-center w-full md:inset-0 bg bg-gray-600/50">
        <div class="relative w-full max-w-2xl max-h-full bg-gray-800 rounded-lg shadow p-6 text-white text-center">
            <h3 class="text-xl font-semibold">
                Create a Room
            </h3>

            <div class="py-4 font-semibold text-gray-400 align-middle">
                <input placeholder="Room name" type="text" maxlength="25" class="w-80 py-2.5 px-5 m-1 text-sm font-medium rounded-lg border border-gray-400 bg-gray-600 outline-none text-white" v-model="newRoom.title">

                <div class="flex justify-center items-center mt-2 mb-1">
                    <label>Private</label>

                    <span :class="{
                        'bg-blue-500': newRoom.private,
                        'bg-gray-600': !newRoom.private
                    }" class="relative inline-block w-12 h-6 ml-2 rounded-md transition-colors duration-300 ease-in-out cursor-pointer"
                        @click="togglePrivate">
                        <span :class="{
                            'translate-x-6_5': newRoom.private,
                            'translate-x-0.5': !newRoom.private
                        }"
                            class="absolute left-0 top-0 w-5 h-5 bg-white rounded-md shadow transform transition-transform duration-300 ease-in-out"
                            style="margin-top: 2px;"></span>
                    </span>
                </div>
                
                <small v-if="newRoom.private" class="font-normal">Private rooms will be deleted after 14 days of inactivity</small>
            </div>

            <div class="flex justify-center">
                <button data-modal-hide="default-modal" type="button" class="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold" @click="createRoom">Create</button>
                <button data-modal-hide="default-modal" type="button" class="py-2.5 px-5 ms-3 text-sm font-medium rounded-lg bg-gray-600 hover:bg-gray-700" @click="newRoom.private = false;newRoom.open = false;newRoom.title = '';">Cancel</button>
            </div>
        </div>
    </div>
    
    <!--Room joining modal-->
    <div v-if="joinRoomModal.open" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 bottom-0 z-40 flex justify-center items-center w-full md:inset-0 bg bg-gray-600/50">
        <div class="relative w-full max-w-2xl max-h-full bg-gray-800 rounded-lg shadow p-6 text-white text-center">
            <h3 class="text-xl font-semibold">
                Join a Private Room
            </h3>

            <div class="py-4 font-semibold text-gray-400 align-middle">
                <input placeholder="Room code" type="text" minlength="5" maxlength="5" class="w-80 py-2.5 px-5 m-1 text-sm font-medium rounded-lg border border-gray-400 bg-gray-600 outline-none text-white" v-model="joinRoomModal.code">
            </div>

            <div class="flex justify-center">
                <button data-modal-hide="default-modal" type="button" class="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold" @click="joinPrivateRoom">Join</button>
                <button data-modal-hide="default-modal" type="button" class="py-2.5 px-5 ms-3 text-sm font-medium rounded-lg bg-gray-600 hover:bg-gray-700" @click="joinRoomModal.open = false;joinRoomModal.code = '';">Cancel</button>
            </div>
        </div>
    </div>
    
    <!--Username picker modal-->
    <div v-if="usernameModal.open" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 bottom-0 z-40 flex justify-center items-center w-full md:inset-0 bg bg-gray-600/50">
        <div class="relative w-full max-w-2xl max-h-full bg-gray-800 rounded-lg shadow p-6 text-white text-center">
            <h3 class="text-xl font-semibold">
                Pick a Username
            </h3>

            <div class="py-4 font-semibold text-gray-400 align-middle">
                <input placeholder="Username" type="text" class="w-80 py-2.5 px-5 m-1 text-sm font-medium rounded-lg border border-gray-400 bg-gray-600 outline-none text-white" v-model="usernameModal.username">
            </div>

            <div class="flex justify-center">
                <button data-modal-hide="default-modal" type="button" class="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold" @click="setUsername">Save</button>
                <button data-modal-hide="default-modal" type="button" class="py-2.5 px-5 ms-3 text-sm font-medium rounded-lg bg-gray-600 hover:bg-gray-700" @click="usernameModal.open = false;usernameModal.username = context.username;">Cancel</button>
            </div>
        </div>
    </div>

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

            <h1 class="px-4 py-2 text-xm font-bold p-1 rounded-md z-50" :class="{
                'bg-red-500': context.notif.status === 2,
                'bg-yellow-500': context.notif.status === 1,
                'bg-blue-500': context.notif.status === 0
            }" v-if="context.notif.showing">{{ context.notif.text }}</h1>

            <div class="flex items-center">
                <button @click="usernameModal.open = true" class="w-full px-5 py-2.5 mr-4 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold">
                    {{ context.username || 'Set Username' }}
                </button>

                <h3 class="text-nowrap">Users: {{ context.online }}</h3>
            </div>
        </div>

        <div class="flex flex-1 overflow-hidden mt-4 relative">
            <div class="w-64 p-4 pr-0 pb-32 bg-gray-800 rounded-lg">
                <details open v-if="context.privateRooms.length !== 0">
                    <summary class="font-bold cursor-pointer">
                        Private Rooms
                    </summary>

                    <ul class="overflow-y-scroll h-full scrollbar-transparent">
                        <li v-for="(room, index) in context.privateRooms" :key="index" class="my-2 rounded-lg">
                            <button @click="joinRoom(room)" class="w-full px-4 py-2 rounded-lg" :class="room.highlight ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-blue-500 text-white hover:bg-blue-600'">
                                {{ room.title }}
                            </button>
                        </li>
                    </ul>
                </details>
                
                <details :open="context.publicRooms.length !== 0">
                    <summary class="font-bold cursor-pointer">
                        Public Rooms
                    </summary>

                    <ul class="overflow-y-scroll h-full scrollbar-transparent" v-if="context.publicRooms.length !== 0">
                        <li v-for="(room, index) in context.publicRooms" :key="index" class="my-2 rounded-lg">
                            <button @click="joinRoom(room)" class="w-full px-4 py-2 rounded-lg" :class="room.highlight ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-blue-500 text-white hover:bg-blue-600'">
                                {{ room.title }}
                            </button>
                        </li>
                    </ul>
                </details>

                <div class="absolute bottom-0 left-0 right-0 p-2 w-64 bg-gray-800 rounded-lg">
                    <button @click="joinRoomModal.open = true" class="w-full px-5 py-2.5 mb-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-sm font-bold">
                        Join Room
                    </button>

                    <button @click="newRoom.open = true" class="w-full px-5 py-2.5 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-bold">
                        Create Room
                    </button>
                </div>

                <p v-if="context.rooms.length === 0" class="mt-4 text-gray-300 text-sm">
                    No active rooms, create one below
                </p>
            </div>

            <div v-if="context.roomid" class="flex-1 p-4 overflow-y-auto rounded-lg">
                <h3 class="font-bold">Welcome to #{{ currentRoomTitle }}</h3>
                <h3 v-if="!!context.rooms.find((room) => {
                    if (room.id === context.roomid && room.private) return true;
                })" class="font-bold">Invite people with this code: {{ context.rooms.find((room) => {
                    if (room.id === context.roomid && room.private) return true;
                }).code }}</h3>

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