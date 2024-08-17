<script setup>
import { notif, hideNotif } from '@/utils';
import { context } from '@/store';
import socket from '@/socket';

const adminhandler = (command) => socket.emit('admin handler', {
    adminpass: context.adminpass,
    command
});

const highlight = () => socket.emit('admin handler', { adminpass: context.adminpass, command: 'highlight', roomid: context.roomid, data: { username: context.username, message: context.command } });
const updateMaxRooms = () => socket.emit('updateMaxRooms', { adminpass: this.adminpass, maxRooms: this.maxRooms });
const passchange = () => socket.emit('passchange', { adminpass: context.adminpass, newpass: context.command });
const toggleSwitch = (e) => {
    context.delete = !context.delete;
    
    if (context.delete) notif('Click on a room or message to delete it', {
        expires: 0,
        status: 1
    });
    else hideNotif();
}
</script>

<template>
    <div class="p-2 mt-2 bg-gray-800 rounded-lg text-center">
        <div class="flex justify-center">
            <form @submit.prevent="adminhandler(context.command)">
                <input placeholder="Admin Password" type="password" class="px-4 py-2 bg-white text-black rounded-lg m-1 w-64" required v-model="context.adminpass">
                <input placeholder="Admin command" type="text" autocomplete="off" class="px-4 py-2 bg-white text-black rounded-lg m-1 w-80" required v-model="context.command">
                <input class="m-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg" type="submit">
            </form>
        </div>
        
        <div class="flex justify-center">
            <input v-model="maxRooms" type="number" min="1" class="px-4 bg-white text-black rounded-lg m-1 w-64" placeholder="Max rooms" />
            <button @click="updateMaxRooms" class="m-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg">
                Set Max Rooms
            </button>
        </div>
        
        <h2 class="text-xl">Quick Access:</h2>
        <div class="flex justify-center">
            <button class="w-24 px-4 py-2 m-1 bg-blue-500 hover:bg-blue-600 rounded-lg" @click="adminhandler('lockall')">Lock</button>
            <button class="w-24 px-4 py-2 m-1 bg-blue-500 hover:bg-blue-600 rounded-lg" @click="adminhandler('unlockall')">Unlock</button>
            <button class="w-38 px-4 py-2 m-1 bg-blue-500 hover:bg-blue-600 rounded-lg" @click="adminhandler('purge')">Purge Rooms</button>
            <button class="w-24 px-4 py-2 m-1 bg-blue-500 hover:bg-blue-600 rounded-lg" @click="highlight()">Highlight</button>
            <button class="w-38 px-4 py-2 m-1 bg-blue-500 hover:bg-blue-600 rounded-lg" @click="passchange()">Change Password</button>
            
            <div class="flex items-center">
                <label class="m-1">Zap mode:</label>
                
                <span :class="{
                        'bg-blue-500': context.delete,
                        'bg-gray-500': !context.delete
                    }"class="relative inline-block w-12 h-6 rounded-md transition-colors duration-300 ease-in-out cursor-pointer"
                    @click="toggleSwitch">
                    <span :class="{
                            'translate-x-6_5': context.delete,
                            'translate-x-0.5': !context.delete
                        }" class="absolute left-0 top-0 w-5 h-5 bg-white rounded-md shadow transform transition-transform duration-300 ease-in-out" style="margin-top: 2px;"></span>
                </span>
            </div>
        </div>

        <p>Default password is <span style="color: rgb(0, 140, 255);">changeme</span>
            to change the password enter the current admin password into <span style="color: rgb(0, 140, 255);">Admin Password</span>
            put the new one in <span style="color: rgb(0, 140, 255);">Admin command</span>
            then click <span style="color: rgb(0, 140, 255);">Change Password</span></p>
    </div>
</template>