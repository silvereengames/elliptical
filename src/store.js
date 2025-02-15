import { reactive, computed } from "vue"

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
