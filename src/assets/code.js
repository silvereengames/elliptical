import socket from "@/assets/socket"
import { context, newRoom, latestMessage } from "./store"

export const onSubmit = () => {
  if (context.input) {
    if (context.highlight)
      socket.emit("admin handler", {
        adminpass: context.adminpass,
        command: "highlight",
        roomid: context.roomid,
        message: `${context.username}: ${context.input}`,
      })
    else
      socket.emit("message", {
        username: context.username,
        message: `${context.username}: ${context.input}`,
        roomid: context.roomid,
      })

    latestMessage.value = `${context.username}: ${context.input}`

    context.input = ""
  }
}

export const promptUsername = () => {
  const username = prompt("Please enter your username")

  if (username) context.username = username

  localStorage.setItem("username", context.username)
}

export const joinRoom = (room) => {
  if (context.delete)
    return socket.emit("admin handler", {
      adminpass: context.adminpass,
      command: "deleteroom",
      roomid: room.id,
    })

  if (context.highlight)
    return socket.emit("admin handler", {
      adminpass: context.adminpass,
      command: "highlight",
      roomid: room.id,
    })

  if (room.id === context.roomid) return

  socket.emit("join", room.id)
}

export const deletemsg = (msgid) => {
  if (context.delete) {
    socket.emit("admin handler", {
      adminpass: context.adminpass,
      command: "deletemsg",
      msgid: msgid,
      roomid: context.roomid,
    })
  }
}

export const joinReports = () => {
  socket.emit("admin handler", {
    adminpass: context.adminpass,
    command: "joinreports",
  })
}

export const gotomsg = (roomid, msgid) => {
  joinRoom({ id: roomid })

  setTimeout(() => {
    document.getElementById(msgid)?.scrollIntoView({ behavior: "smooth" })
  }, 800)
}

export const reportmsg = (msg) => {
  socket.emit("report msg", {
    msgid: msg.id,
    roomid: context.roomid,
    message: msg.msg,
  })
}

export const togglePrivate = () => (newRoom.private = !newRoom.private)
export const createRoom = () => {
  if (!newRoom.title)
    return notif("A room title was not provided", {
      status: 2,
    })

  const code = (Math.random() + 1).toString(36).substring(7)

  socket.emit("room", {
    title: newRoom.title,
    private: newRoom.private,
    ...(newRoom.private
      ? {
          code,
        }
      : {}),
  })

  if (newRoom.private && "private-codes" in localStorage)
    try {
      const codes = JSON.parse(localStorage.getItem("private-codes"))

      codes.push(code)

      context.codes = codes
      localStorage.setItem("private-codes", JSON.stringify(codes))
    } catch {
      context.codes = [code]
      localStorage.setItem("private-codes", JSON.stringify([code]))
    }

  newRoom.private = false
  newRoom.open = false
  newRoom.title = ""
}

export const copyCode = () => {
  notif("Copied room code to clipboard")

  navigator.clipboard.writeText(
    context.rooms.find(({ id }) => context.roomid === id).code
  )
}

export const leave = () => {
  const currentCode = context.rooms.find(({ id }) => context.roomid === id).code

  try {
    const codes = JSON.parse(localStorage.getItem("private-codes")).filter(
      (code) => code !== currentCode
    )

    context.codes = codes

    localStorage.setItem("private-codes", JSON.stringify(codes))
  } catch {
    context.codes = context.codes.filter((code) => code !== currentCode)
  }
  context.roomid = null
  context.rooms.splice(
    context.rooms.indexOf(
      context.rooms.filter((room) => room.id !== context.roomid)
    ),
    1
  )
}
