import { v4 as uuid } from "uuid"
import { build, createServer as createViteServer } from "vite"

import { createInterface } from "node:readline"
import path from "node:path"
import url from "node:url"

import { io, app, server } from "./server/host.js"
import { executeUserInput } from "./server/adminhandler.js"
import { get, getroom } from "./server/functions.js"
import { rooms, adminpass, reports, initializeDB } from "./server/mongo.js"
import { context } from "./server/context.js"

// Initalize server stuff
const __dirname = url.fileURLToPath(new URL("./", import.meta.url))


// frontend
if (process.argv.includes("--dev")) {
  // if dev mode start vite server
  const vite = await createViteServer({
    server: { middlewareMode: "html" },
  })
  app.use(vite.middlewares)
  console.log("✅ Vite development server served with middleware")
} else {
  // prod, serve from dist
  console.log("🔁 Building for production...")
  await build()
  app.use(express.static("dist"))
  app.use((req, res) =>
    res.sendFile(path.join(__dirname, "dist", "index.html"))
  )
  console.log("✅ Production build served from dist")
}

// Handle socket.io events
io.on("connection", async (socket) => {
  console.log("📥 New user connected with id", socket.id)

  socket.join("home")
  context.ONLINE++
  io.emit("users", context.ONLINE)
  getroom(socket)

  socket.on("message", async ({ roomid, message }) => {
    const filtermsgspace = message.replaceAll(" ", "")
    const filtermsgcaps = filtermsgspace.toLowerCase()
    const messageIncludesBlockedTerm = context.BLOCKED.some((term) =>
      filtermsgcaps.includes(term)
    )

    // Emit a warning or take other appropriate action
    if (messageIncludesBlockedTerm)
      socket.emit("event", {
        message: "Message contains a blocked phrase",
        status: 2,
      })
    else if (context.LOCKED)
      socket.emit("event", {
        message: "Chat has been locked",
        status: 1,
      })
    else {
      if (message.length >= 200) {
        socket.emit("event", {
          message: "Too many characters in message (200 max)",
          status: 2,
        })
      } else {
        const id = uuid()

        await rooms.updateOne(
          {
            roomid,
          },
          {
            $push: {
              messages: {
                message,
                msgid: id,
              },
            },
          }
        )

        io.emit("message", {
          message,
          id,
        })
      }
    }
  })

  socket.on("room", async (room) => {
    if (typeof room.title !== "string") return

    const messageIncludesBlockedTerm = context.BLOCKED.some((term) =>
      room.title.replaceAll(" ", "").toLowerCase().includes(term)
    )
    const roomCount = await rooms.countDocuments({ private: false })

    if (messageIncludesBlockedTerm)
      socket.emit("event", {
        message: "Room name contains a blocked phrase",
        status: 2,
      })
    else if (context.LOCKED == true)
      socket.emit("event", {
        message: "Chat has been locked",
        status: 1,
      })
    else if (roomCount >= context.MAX_ROOMS)
      socket.emit("event", {
        message: "Too many rooms",
        status: 2,
      })
    else {
      if (room.title.length >= 25)
        socket.emit("event", {
          message: "Too many characters in room name (25 max)",
          status: 2,
        })
      else {
        const id = uuid()

        await rooms.insertOne({
          title: room.title,
          roomid: id,
          private: room.private && !!room.code,
          ...(room.private && room.code
            ? {
                code: room.code,
              }
            : {}),
          messages: [],
        })

        if (room.private && room.code)
          socket.emit("room", {
            title: room.title,
            code: room.code,
            private: true,
            id,
          })
        else
          io.to("home").emit("room", {
            title: room.title,
            id,
          })
      }
    }
  })

  socket.on("join private", async (code) => {
    try {
      const room = await rooms.findOne({ code })

      room.id = room.roomid

      delete room._id
      delete room.roomid

      socket.emit("room", room)
    } catch {} // Room does not exist
  })

  socket.on("join", async (id) => {
    try {
      console.log(id)
      socket.join(id)
      socket.emit("joined", id)
      get(socket, id)
    } catch (e) {
      console.warn("❌ Error!", e)
    }
  })

  socket.on("disconnect", () => {
    context.ONLINE--

    io.emit("users", context.ONLINE)
  })

  socket.on("report msg", async (msg) => {
    try {
      // Check if report already exists
      const existingReport = await reports.findOne({
        msgid: msg.msgid,
        roomid: msg.roomid,
      })

      if (!existingReport) {
        // Only insert if no existing report found
        await reports.insertOne({
          msgid: msg.msgid,
          roomid: msg.roomid,
          message: msg.message,
          timestamp: new Date(),
        })

        console.log("📝 New report added:", msg)
      }

      socket.emit("event", {
        message: "Message reported",
      })
    } catch (error) {
      console.error("❌ Error handling report:", error)
    }
  })

  socket.on("admin handler", (msg) => {
    if (msg.adminpass.includes(context.PASSWORD)) executeUserInput(msg, socket)
    else console.log("❌ Invalid admin password attempt: " + msg.adminpass)
  })

  socket.on("passchange", (msg) => {
    if (msg.adminpass.includes(context.PASSWORD)) {
      adminpass.updateOne(
        {
          id: "admin",
        },
        {
          $set: {
            password: msg.newpass,
          },
        }
      )

      context.PASSWORD = msg.newpass
      socket.emit("event", {
        message: "Success",
      })

      console.log("✅ Password changed to: " + msg.newpass)
    } else console.log("❌ Invalid admin password attempt: " + msg.adminpass)
  })

  socket.on("updateMaxRooms", (msg) => {
    if (msg.adminpass.includes(context.PASSWORD)) {
      context.MAX_ROOMS = msg.maxRooms

      socket.emit("event", {
        message: "Success",
      })

      console.log("✅ Max rooms updated to: " + context.MAX_ROOMS)
    } else console.log("❌ Invalid admin password attempt: " + msg.adminpass)
  })
})

await initializeDB()

// Start the server
server.listen(3000, () =>
  console.log("✅ Elliptical server running at http://localhost:3000")
)

// Create a simple command line interface for executing commands
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

const command = () =>
  rl.question("✅ Ready for chat commands\n", (input) => {
    executeUserInput({ command: input }) // Execute your function
    command()
  })

command()
