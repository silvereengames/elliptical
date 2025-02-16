import { reactive, computed, ref } from "vue"

export const path = location.pathname;

export const context = reactive({
  input: "",
  username: localStorage.getItem("username") || "",
  codes: [],
  messages: [],
  reports: [],
  rooms: [],
  privateRooms: computed(
    () => context.rooms.filter((room) => room.private) || []
  ),
  publicRooms: computed(
    () => context.rooms.filter((room) => !room.private) || []
  ),
  roomid: null,
  online: 0,
  delete: false,
  highlight: false,
  adminpass: "",
  command: "",
  maxRooms: '',
  status: {
    code: 1,
    text: "Connecting",
  },
  notif: {
    showing: false,
    status: 0,
    text: "",
    id: "",
  },
})

export const showMain = ref(false);

export const newRoom = reactive({
  open: false,
  title: "",
  private: false,
});

export const joinRoomModal = reactive({
  open: false,
  code: "",
});

export const usernameModal = reactive({
  open: false,
  username: context.username,
});

export const soundsEnabled = ref(localStorage.getItem("sounds") === null ? true : localStorage.getItem("sounds") === "true");

export const latestMessage = ref("");
