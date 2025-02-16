import { adminpass, rooms, reports } from "./mongo.js"
import { context } from "./context.js"

export const password = async () => {
  const result = await adminpass.findOne({ id: "admin" })

  if (result) return (context.PASSWORD = result.password)

  adminpass.insertOne({
    id: "admin",
    password: context.PASSWORD,
  })
}

export const getroom = async (socket) => {
  const result = rooms.find({
    private: false,
  })

  for await (const room of result) {
    if (room.data === "room") socket.emit("room", room)
    else
      socket.emit("room", {
        highlight: room.highlight,
        title: room.title,
        id: room.roomid,
      })
  }
}

export const get = async (socket, id) => {
  try {
    const room = await rooms.findOne({ roomid: id })

    if (!room || !room.messages) return

    for (const message of room.messages) {
      socket.emit("message", message)
    }
  } catch (error) {
    console.warn("❌ Error! " + error)
  }
}

export const getReports = async (socket) => {
  try {
    const reportsCursor = reports.find({})
    
    // Send each report to the client
    for await (const report of reportsCursor) {
      const message ={msgid: report.msgid, roomid: report.roomid, message: report.message, time: report.timestamp}
      socket.emit("report", message)
    }
  } catch (error) {
    console.warn("❌ Error! " + error)
  }
}