import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createInterface } from "readline";
import { MongoClient } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitize } from "./mongo-sanitize.js";

let client = null;
//database
if (process.argv[2] == "Docker") {
  client = new MongoClient("mongodb://mongodb:27017");
} else {
  client = new MongoClient("mongodb://127.0.0.1:27017");
}

const db = client.db("elliptical");
const rooms = db.collection("rooms");
const adminpass = db.collection("admin-password");
async function start() {
  try {
    await client.connect();
    // await chats.createIndex({ createdAt: 1 }, { expireAfterSeconds: expire * 3600 });
    console.log("✅ Connected to MongoDB!");
    password();
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
  }
}

const expire = 1; //Time until messages expire from database in hours(I think) if this causes an error try deleting the collection in mongodb
const app = express();
const server = createServer(app);
const io = new Server(server);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173"
//   }
// });

var locked = false;
var cooldown = 1000;
var cooldownlocked = false;
var active = 0;
var adminpassword = "changeme";
let MAX_ROOMS = 25; // default is 25

const blockedTerms = ["example"];

start();

app.use(express.static('dist'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

async function password() {
  let result = await adminpass.findOne({ id: "admin" });
  if (result == null) {
    adminpass.insertOne({ id: "admin", password: sanitize(adminpassword) });
  } else {
    adminpassword = result.password;
  }
}

async function getroom(socket) {
  socket.emit("clear", "");
  let result = rooms.find({}, { projection: { _id: 0 } });
  for await (const doc of result) {
    if (doc.data === "highlight") {
      socket.emit("highlight", doc);
    } else {
      socket.emit("room", doc);
    }
  }
}

async function get(socket, id) {
  try {
    socket.emit("clearmessages", "");
    let room = await rooms.findOne({ roomid: sanitize(id) });
    let msg = room.messages;
    if (msg !== undefined) {
      for (const doc of msg) {
        if (doc.data === "highlight") {
          socket.emit("highlight", doc);
        } else {
          socket.emit("chat message", doc);
        }
      }
    }
  } catch (error) {
    console.warn("❌ Error! " + error);

  }
}

async function executeUserInput(input) {
  try {
    let command = input.command;
    if (command.charAt(0) === "m") {
      io.emit("event", `<span style='color:red;font-weight:800'>Server: ${command.substring(2)}</span>`);
    } else if (command == "lockall") {
      console.log("🔒 All chats locked!");
      io.emit("event", "🔒 Chat has been locked!");
      locked = true;
    } else if (command == "unlockall") {
      console.log("🔓 All chats unlocked!");
      io.emit("event", "🔓 Chat has been unlocked!");
      locked = false;
    } else if (command == "refresh") {
      io.emit("reload", "");
    } else if (command == "purge") {
      rooms.deleteMany({});
      io.emit("reload", "");
    } else if (command.includes("opentab")) {
      let message = command.substring(7);
      io.emit("opentab", message);
    } else if (command == "deletemsg") {
      await rooms.updateOne({ roomid: sanitize(input.roomid) }, { $pull: { messages: { msgid: sanitize(input.msgid) } } });
      io.to(input.roomid).emit("deletemsg", input.msgid);
    } else if (command == "deleteroom") {
      await rooms.deleteOne({ roomid: sanitize(input.roomid) });
      io.to(input.roomid).emit("reload", "");
      io.to("home").emit("deleteroom", input.roomid);
    } else if (command == "highlight") {
      // Broadcast the message to others
      //const markdown = converter.makeHtml(msg.replace('adminpassword', ''));
      let message = input.data.username + ": " + input.data.message;
      let id = uuidv4();
      if (input.roomid !== null) {
        await rooms.updateOne(
          { roomid: sanitize(input.roomid) }, 
          { $push: { messages: { message: sanitize(message), msgid: sanitize(id), data: "highlight" } } });
        io.to(input.roomid).emit("highlight", { message: message, msgid: id, data: "highlight" });
      } else {
        await rooms.insertOne({ title: sanitize(input.data.message), roomid: sanitize(id), data: "highlight" });
        io.to("home").emit("highlight", { title: input.data.message, data: "highlight", roomid: id });
      }
    } else {
      console.log("❌ Invalid command!");
    }
  } catch (error) {
    console.warn("❌ Error! " + error);
  }
}

io.on("connection", async (socket) => {
  console.log("📥 New user connected: " + socket.id);
  //io.emit('event', 'A user connected');
  socket.join("home");
  active++;
  io.emit("users", active);
  getroom(socket);
  // get(socket);
  socket.on("chat message", async (message) => {
    let msg = message.msg;
    const filtermsgspace = msg.replaceAll(" ", "");
    const filtermsgcaps = filtermsgspace.toLowerCase();
    const regex = /^[ -~]*$/;
    const messageIncludesBlockedTerm = blockedTerms.some((term) => filtermsgcaps.includes(term));
    if (messageIncludesBlockedTerm) {
      // Emit a warning or take other appropriate action
      socket.emit("event", "<span style='color:red;font-weight:800'>Your message could not be sent due to the active moderation rules.</span>");
    } else if (!regex.test(msg)) {
      socket.emit("event", "<span style='color:red;font-weight:800'>Your message could not be sent due to the active moderation rules.</span>");
    } else if (locked == true) {
      socket.emit("event", "<span style='color:red;font-weight:800'>Your message could not be sent due to the chat being locked</span>");
    } else {
      if (msg.length >= 200) {
        socket.emit("event", "<span style='color:red;font-weight:800'>Your message could not be sent due to it being longer than 200 characters</span>");
      } else {
        // const itemidnum = Math.floor(Math.random() * 1000);
        // const messageid = btoa(msg.replaceAll(' ', '') + itemidnum);
        let messageid = uuidv4();
        await rooms.updateOne(
          { roomid: sanitize(message.roomid) }, 
          { $push: { messages: { message: sanitize(msg), msgid: sanitize(messageid) } } });
        io.emit("chat message", { message: msg, msgid: messageid });
      }
    }
  });

  socket.on("room", async (msg) => {
    let filtermsgspace = "";
    if (typeof msg === "string") {
      filtermsgspace = msg.replaceAll(" ", "");
    } else {
      console.error("❌ msg is not a string:", msg);
    }
    const filtermsgcaps = filtermsgspace.toLowerCase();
    const regex = /^[ -~]*$/;
    const messageIncludesBlockedTerm = blockedTerms.some((term) => filtermsgcaps.includes(term));
    
    const roomCount = await rooms.countDocuments();
  
    if (messageIncludesBlockedTerm) {
      socket.emit("event", "<span style='color:red;font-weight:800'>Your room could not be created due to the active moderation rules!</span>");
    } else if (!regex.test(msg)) {
      socket.emit("event", "<span style='color:red;font-weight:800'>Your room could not be created due to the active moderation rules!</span>");
    } else if (locked == true) {
      socket.emit("event", "<span style='color:red;font-weight:800'>Your room could not be created due to chat being locked!</span>");
    } else if (roomCount >= MAX_ROOMS) {
      socket.emit("event", "<span style='color:red;font-weight:800'>Your room could not be created due to the room limit!</span>");
    } else {
      if (msg.length >= 25) {
        socket.emit("event", "<span style='color:red;font-weight:800'>Your room could not be created due to the name exceeding 25 characters</span>");
      } else {
        let roomid = uuidv4();
        await rooms.insertOne({ title: sanitize(msg), roomid: sanitize(roomid) });
        io.to("home").emit("room", { title: msg, roomid: roomid });
      }
    }
  });

  socket.on("joinroom", async (id) => {
    try {
      socket.join(id);
      socket.emit("joined", id);
      get(socket, id);
    } catch (error) {
      console.warn("❌ Error! " + error);
    }
  });

  socket.on("disconnect", () => {
    //io.emit('event', 'A user disconnected');
    active--;
    io.emit("users", active);
  });

  socket.on("admin handler", (msg) => {
    if (msg.adminpass === adminpassword) {
      executeUserInput(msg);
      //console.log(msg);
      //console.log(msg.replace('adminpassword', ''));
    } else {
      console.log("❌ Invalid admin password attempt: " + msg.adminpass);
    }
  });
  socket.on("passchange", (msg) => {
    console.log(adminpassword)
    if (msg.adminpass === adminpassword) {
      adminpass.updateOne({ id: "admin" }, { $set: { password: sanitize(msg.newpass) } });
      adminpassword = msg.newpass;
      socket.emit("event", "<span style='color:green;font-weight:800'>Password changed successfully!</span>");
      // console log new password
      console.log("✅ Password changed to: " + msg.newpass);
    } else {
      console.log("❌ Invalid admin password attempt: " + msg.adminpass);
    }
  });
  socket.on("updateMaxRooms", (msg) => {
    if (msg.adminpass === adminpassword) {
      MAX_ROOMS = msg.maxRooms;
      socket.emit("event", "<span style='color:green;font-weight:800'>Max rooms updated successfully!</span>");
      console.log("✅ Max rooms updated to: " + MAX_ROOMS);
    } else {
      console.log("❌ Invalid admin password attempt: " + msg.adminpass);
    }
  });
});

server.listen(3000, () => {
  console.log("✅ Elliptical server running at http://localhost:3000");
});

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function command() {
  rl.question("✅ Ready for chat commands!\n", (input) => {
    executeUserInput({ command: input }); // Execute your function
    command();
  });
}

command();
