import { reactive } from 'vue'

export const stuff = reactive({
  input: "",
  username: localStorage.getItem("username") || "",
  messages: [],
  rooms: [],
  roomid: null,
  usersOnline: 0,
  delete: false,
  adminpass: "",
  command: ""
});