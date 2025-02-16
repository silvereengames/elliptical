import { v4 as uuid } from "uuid"
import { io } from "./host.js"
import { getReports } from "./functions.js"
import { rooms } from "./mongo.js"
import { context } from "./context.js"

export const executeUserInput = async (input, socket) => {
  try {
    const command = input.command

    if (command.charAt(0) === "m")
      io.emit("event", {
        message: `Server: ${command.substring(2)}`,
      })
    else if (command == "lockall") {
      io.emit("event", {
        message: "Chat has been locked",
        status: 1,
      })
      console.log("🔒 All chats locked!")

      context.LOCKED = true
    } else if (command == "unlockall") {
      io.emit("event", {
        message: "Chat has been unlocked",
      })
      console.log("🔓 All chats unlocked!")

      context.LOCKED = false
    } else if (command == "refresh") io.emit("reload", "")
    else if (command == "purge") {
      rooms.deleteMany({})

      io.emit("purge")
    } else if (command == "eval") {
      console.log("🔁 Running eval...")

      eval(input + "()")
    } else if (command.includes("opentab")) {
      // Should probably remove this as it is a security risk
      let message = command.substring(7)

      io.emit("opentab", message)
    } else if (command == "deletemsg") {
      await rooms.updateOne(
        {
          roomid: input.roomid,
        },
        {
          $pull: {
            messages: {
              msgid: input.msgid,
            },
          },
        }
      )

      io.to(input.roomid).emit("delete", {
        type: "message",
        id: input.msgid,
      })
    } else if (command == "deleteroom") {
      await rooms.deleteOne({ roomid: input.roomid })

      io.to("home").emit("delete", {
        type: "room",
        id: input.roomid,
      })
    } else if (command == "highlight") {
      // Highlight messages in a room
      if (!input.roomid) return

      if (input.message) {
        const id = uuid()

        await rooms.updateOne(
          {
            roomid: input.roomid,
          },
          {
            $push: {
              messages: {
                message: input.message,
                msgid: id,
                highlight: true,
              },
            },
          }
        )

        io.to(input.roomid).emit("message", {
          message: input.message,
          id,
          highlight: true,
        })
      } else {
        await rooms.updateOne(
          { roomid: input.roomid },
          {
            $set: {
              highlight: true,
            },
          }
        )

        const room = await rooms.findOne({ roomid: input.roomid })

        io.to("home").emit("room", {
          title: room.title,
          id: room.roomid,
          highlight: true,
          update: true,
        })
      }
    } else if(command == "joinreports") {
      socket.emit("joined", "reports")
      getReports(socket)
    } else console.log("❌ An invalid command was provided:", command)
  } catch (error) {
    console.warn("❌ Error!", error)
  }
}