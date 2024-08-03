<template>
  <div class="flex flex-col h-screen bg-gray-900 text-white p-4">
    <div class="p-4 bg-gray-800 flex justify-between items-center rounded-lg">
      <h1 class="text-xl font-bold">Elliptical v0.15</h1>
      <div class="flex items-center">
        <button @click="promptUsername" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg mr-4">{{ username || 'Set Username' }}</button>
        <h3 class="sticky">Users Online: {{ usersOnline }}</h3>
      </div>
    </div>
    <div class="flex flex-1 overflow-hidden mt-4">
      <div class="w-64 p-4 bg-gray-800 overflow-y-auto rounded-lg">
        <h3>Rooms</h3>
        <ul>
          <li v-for="(room, index) in rooms" :key="index" class="my-2 rounded-lg">
            <button @click="joinRoom(room)" class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg">
              {{ room.title }}
            </button>
          </li>
        </ul>
        <button @click="promptRoom" class="w-full mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg">Create Room</button>
        <p v-if="rooms.length === 0" class="mt-4 text-red-500">No active rooms. Please create one.</p>
      </div>
      <div v-if="roomid" class="flex-1 p-4 overflow-y-auto rounded-lg">
        <h3>Chats in {{ currentRoomTitle }}</h3>
        <ul>
          <li v-for="(message, index) in messages" :key="index">{{ message }}</li>
        </ul>
      </div>
    </div>
    <form @submit.prevent="onSubmit" class="p-4" v-if="roomid">
      <input v-model="input" autocomplete="off" placeholder="Message" required class="w-full px-4 py-2 bg-white text-black rounded-lg" />
      <button class="w-full mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg">Send</button>
    </form>
  </div>
</template>

<script>
  console.log("Connecting to server...");
  socket.on("connect", () => {
      console.log("Connected to server as " + socket.id);
    });

    socket.on("room", (room) => {
      this.rooms.push(room);
    });

    socket.on("joined", (id) => {
      this.roomid = id;
    });

    socket.on("chat message", (msg) => {
      this.messages.push(msg.message);
    });

    socket.on("users", (msg) => {
      this.usersOnline = msg;
    });
  export default {
    data() {
      return {
        input: "",
        username: localStorage.getItem("username") || "",
        messages: [],
        rooms: [],
        roomid: null,
        usersOnline: 1,
      };
    },
    computed: {
      currentRoomTitle() {
        const room = this.rooms.find((room) => room.id === this.roomid);
        return room ? room.title : "";
      },
    },
    methods: {
      onSubmit() {
        if (this.input) {
          socket.emit("chat message", { msg: `${this.username}: ${this.input}`, roomid: this.roomid });
          this.input = "";
        }
      },
      promptUsername() {
        const username = prompt("Please enter your username");
        if (username) {
          this.username = username;
          localStorage.setItem("username", username);
        }
      },
      promptRoom() {
        const roomTitle = prompt("Please enter a room name");
        if (roomTitle) {
          socket.emit("room", roomTitle);
        }
      },
      joinRoom(room) {
        socket.emit("join", room.id);
      },
    },
  };
</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&family=Raleway:ital,wght@0,100..900;1,100..900&display=swap');

* {
  font-family: "Raleway", sans-serif;
}
</style>