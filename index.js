const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const readline = require('readline');
const showdown = require('showdown');
const { MongoClient } = require('mongodb');

let client = null
//database
if(process.argv[2] == "Docker"){
  client = new MongoClient('mongodb://mongodb:27017');
}
else{
  client = new MongoClient('mongodb://127.0.0.1:27017');
}

const db = client.db("elliptical");
const chats = db.collection("chats");
const adminpass = db.collection("admin-password");
async function start() {
  try {
      await client.connect();
      await chats.createIndex({ createdAt: 1 }, { expireAfterSeconds: expire*3600 });
      console.log('Connected to MongoDB');
      password()
  } catch (error) {
      console.error('Error connecting to MongoDB:', error);
  }
}
async function password(){
  let result = await adminpass.findOne({id: "admin"});
  if(result == null){
    adminpass.insertOne({id: "admin", password: adminpassword})
  }
  else{
    adminpassword = result.password
  }
}
async function find(){
  let result = await chats.find();
  io.emit('clear', "")
  for await (const doc of result) {
    if(doc.msgid == "admin"){
      io.emit('highlight', doc.message);
    }
    else{
      io.emit('chat message', doc);
    }
  }
}
start()

//Time until messages expire from database if this causes an error try deleting the collection in mongodb
const expire = 24

const app = express();
const converter = new showdown.Converter()
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
  "penis"

];

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'admin.html'));
});

app.get('*', (req, res) => {
  res.send("404")
});

app.use(express.static('public'))

function executeUserInput(input) {
  if (input.charAt(0) === 'm') {
    io.emit('event', `<span style='color:red;font-weight:800'>Server: ${input.substring(2)}</span>`)
  } else if (input.charAt(0) === 's') {
    if (input.substring(2) == 'lockall') {
      console.log('Locking all');
      io.emit('event', 'Chat has been locked');
      locked = true;
    } else if (input.substring(2) == 'unlockall') {
      console.log('Unlocking all');
      io.emit('event', 'Chat has been unlocked');
      locked = false;
    } else if (input.substring(2) == 'refresh') {
      io.emit('reload', '');
    } else if (input.substring(2) == 'purge') {
      chats.deleteMany({})
      io.emit('clear', "")
    } else if (input.substring(2).includes('opentab')) {
      let message = input.substring(10);
      io.emit('opentab', message)
    } else if (input.substring(2).includes('removemsg')) {
      let message = input.substring(12);
      io.emit('delete message', message)
    } else if (input.substring(2).includes('highlight')){
      // Broadcast the message to others
      //const markdown = converter.makeHtml(msg.replace('adminpassword', ''));
      let message = input.substring(11);
      chats.insertOne({message: message, msgid: 'admin', createdAt: new Date()})
      io.emit('highlight', message);
    } else{
      console.log("Invalid Command")
    }
  } else{
    console.log("Invalid Command")
  }
}

io.on('connection', (socket) => {
  //io.emit('event', 'A user connected');
  active++;
  io.emit('users', active);
  find();
  socket.on('delete', (msgid)=>{
    chats.deleteOne({msgid: msgid})
  });
  socket.on('chat message', (msg) => {
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
        //const markdown = converter.makeHtml(msg);
        const itemidnum = Math.floor(Math.random() * 1000);
        const messageid = btoa(msg.replaceAll(' ', '') + itemidnum);
        chats.insertOne({message: msg, msgid: messageid, createdAt: new Date()})
        io.emit('chat message', { message: msg, msgid: messageid});
      }
    }
  });
  socket.on('disconnect', () => {
    //io.emit('event', 'A user disconnected');
    active--;
    io.emit('users', active);
  });

  socket.on('admin handler', (msg) => {
    if (msg.includes(adminpassword)) {
      executeUserInput(msg.replace(adminpassword, ''));
      //console.log(msg);
      //console.log(msg.replace('adminpassword', ''));
    }
    else{
      console.log('Invalid Password');
    }
  })
  socket.on('passchange', (msg) => {
    if (msg.includes(adminpassword)) {
      newpass = msg.replace(adminpassword, '')
      adminpass.updateOne({id:"admin"}, {$set:{password: newpass}})
      adminpassword = newpass
    }
    else{
      console.log("Invalid Password")
    }
  })
});




server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});

const rl = readline.createInterface({
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