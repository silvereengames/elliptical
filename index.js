import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createInterface } from 'readline';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

let client = null
//database
if (process.argv[2] == "Docker") {
  client = new MongoClient('mongodb://mongodb:27017');
}
else {
  client = new MongoClient('mongodb://127.0.0.1:27017');
}

const db = client.db("elliptical");
const rooms = db.collection("rooms");
const adminpass = db.collection("admin-password");
async function start() {
  try {
    await client.connect();
    // await chats.createIndex({ createdAt: 1 }, { expireAfterSeconds: expire * 3600 });
    console.log('Connected to MongoDB');
    password()
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

const expire = 1 //Time until messages expire from database in hours(I think) if this causes an error try deleting the collection in mongodb
const app = express();
const server = createServer(app);
const io = new Server(server);
var locked = false;
var cooldown = 1000;
var cooldownlocked = false;
var active = 0;
var adminpassword = "changeme"

const blockedTerms = [
  "cum",
  "porn",
  "sex",
  "nigger",
  "nigga",
  "rape",
  "penis",
  "dick"

];

start()

app.use(express.static('public'))

app.get('*', (req, res) => {
  res.send("404")
});

async function password() {
  let result = await adminpass.findOne({ id: "admin" });
  if (result == null) {
    adminpass.insertOne({ id: "admin", password: adminpassword })
  }
  else {
    adminpassword = result.password
  }
}

async function getroom(socket) {
  socket.emit('clear', "")
  let result = rooms.find({}, { projection: { _id: 0 } });
  for await (const doc of result) {
    if (doc.data === "highlight") {
      socket.emit('highlight', doc);
    } else {
      socket.emit('room', doc);
    }
  }
}

async function get(socket, id) {
  socket.emit('clear', "");
  let room = await rooms.findOne({ roomid: id });
  let msg = room.messages;
  if (msg !== undefined) {
    for (const doc of msg) {
      if (doc.data === "highlight") {
        socket.emit('highlight', doc);
      }
      else {
        socket.emit('chat message', doc);
      }
    }
  }

}

async function executeUserInput(input) {
  let command = input.command
  if (command.charAt(0) === 'm') {
    io.emit('event', `<span style='color:red;font-weight:800'>Server: ${command.substring(2)}</span>`)
  } else if (command == 'lockall') {
    console.log('Locking all');
    io.emit('event', 'Chat has been locked');
    locked = true;
  } else if (command == 'unlockall') {
    console.log('Unlocking all');
    io.emit('event', 'Chat has been unlocked');
    locked = false;
  } else if (command == 'refresh') {
    io.emit('reload', '');
  } else if (command == 'purge') {
    rooms.deleteMany({})
    io.emit('reload', '');
  } else if (command.includes('opentab')) {
    let message = command.substring(7);
    io.emit('opentab', message)
  } else if (command == ('removemsg')) {
    await rooms.updateOne({ roomid: input.roomid }, { $pull: { messages: { msgid: input.msgid } } })
    io.to(input.roomid).emit('delete message', input.msgid)
  } else if (command == ('deleteroom')) {
    await rooms.deleteOne({ roomid: input.roomid })
    io.to(input.roomid).emit('reload', '');
    io.to("home").emit('delete message', input.roomid)
  } else if (command == ('highlight')) {
    // Broadcast the message to others
    //const markdown = converter.makeHtml(msg.replace('adminpassword', ''));
    let message = input.data.username + ": " + input.data.message;
    let id = uuidv4();
    if (input.roomid !== null) {
      await rooms.updateOne({ roomid: input.roomid }, { $push: { messages: { message: message, msgid: id, data: "highlight" } } })
      io.to(input.roomid).emit('highlight', { message: message, msgid: id, data: "highlight" });
    } else {
      await rooms.insertOne({ title: input.data.message, roomid: id, data: "highlight" });
      io.to("home").emit('highlight', { title: input.data.message, data: "highlight", roomid: id });
    }
  } else {
    console.log("Invalid Command")
  }
}


io.on('connection', async (socket) => {
  //io.emit('event', 'A user connected');
  socket.join('home');
  active++;
  io.emit('users', active);
  getroom(socket);
  // get(socket);
  socket.on('chat message', async (message) => {
    let msg = message.msg;
    const filtermsgspace = msg.replaceAll(' ', '');
    const filtermsgcaps = filtermsgspace.toLowerCase();
    const regex = /^[ -~]*$/;
    const messageIncludesBlockedTerm = blockedTerms.some(term => filtermsgcaps.includes(term));
    if (messageIncludesBlockedTerm) {
      // Emit a warning or take other appropriate action  
      socket.emit('event', "<span style='color:red;font-weight:800'>Error - Message not sent: You send a blocked word or phrase </span>");
    } else if (!regex.test(msg)) {
      socket.emit('event', "<span style='color:red;font-weight:800'>Error - Message not sent: You send a blocked word or phrase </span>");
    } else if (locked == true) {
      socket.emit('event', "<span style='color:red;font-weight:800'>Error - Chat is locked</span>");
    } else {
      if (msg.length >= 200) {
        socket.emit('event', "<span style='color:red;font-weight:800'>Error - Message not sent: Message above 200 charcters</span>");
      } else {
        // const itemidnum = Math.floor(Math.random() * 1000);
        // const messageid = btoa(msg.replaceAll(' ', '') + itemidnum);
        let messageid = uuidv4();
        await rooms.updateOne({ roomid: message.roomid }, { $push: { messages: { message: msg, msgid: messageid } } })
        io.emit('chat message', { message: msg, msgid: messageid });
      }
    }
  });

  socket.on('room', async (msg) => {
    const filtermsgspace = msg.replaceAll(' ', '');
    const filtermsgcaps = filtermsgspace.toLowerCase();
    const regex = /^[ -~]*$/;
    const messageIncludesBlockedTerm = blockedTerms.some(term => filtermsgcaps.includes(term));
    if (messageIncludesBlockedTerm) {
      // Emit a warning or take other appropriate action  
      socket.emit('event', "<span style='color:red;font-weight:800'>Error - Room not created: You sent a blocked word or phrase </span>");
    } else if (!regex.test(msg)) {
      socket.emit('event', "<span style='color:red;font-weight:800'>Error - Room not created: You sent a blocked word or phrase </span>");
    } else if (locked == true) {
      socket.emit('event', "<span style='color:red;font-weight:800'>Error - Chat is locked</span>");
    } else {
      if (msg.length >= 200) {
        socket.emit('event', "<span style='color:red;font-weight:800'>Error - Room not created: Title above 200 charcters</span>");
      } else {
        // const itemidnum = Math.floor(Math.random() * 1000);
        // const messageid = btoa(msg.replaceAll(' ', '') + itemidnum);
        let roomid = uuidv4();
        await rooms.insertOne({ title: msg, roomid: roomid })
        io.to("home").emit('room', { title: msg, roomid: roomid });
      }
    }
  });

  socket.on('joinroom', async (id) => {
    try {
      socket.join(id);
      socket.emit("joined", id);
      get(socket, id);
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('disconnect', () => {
    //io.emit('event', 'A user disconnected');
    active--;
    io.emit('users', active);
  });

  socket.on('admin handler', (msg) => {
    if (msg.adminpass.includes(adminpassword)) {
      executeUserInput(msg);
      //console.log(msg);
      //console.log(msg.replace('adminpassword', ''));
    }
    else {
      console.log('Invalid Password');
    }
  })
  socket.on('passchange', (msg) => {
    console.log(msg)
    if (msg.adminpass.includes(adminpassword)) {
      adminpass.updateOne({ id: "admin" }, { $set: { password: msg.newpass } })
      adminpassword = msg.newpass
      socket.emit('event', "<span style='color:green;font-weight:800'>Password Change Successful</span>");

    }
    else {
      console.log("Invalid Password")
    }
  })
});




server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function command() {
  rl.question('Please type chat commands ', (input) => {
    executeUserInput(input); // Execute your function
    command();
  });
}

command();