import { MongoClient } from 'mongodb';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import express from 'express';
import { build } from 'vite';

import { createInterface } from 'node:readline';
import http from 'node:http';
import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';

// Initalize database stuff
const client = new MongoClient(process.argv[2] == 'Docker' ? 'mongodb://mongodb:27017' : 'mongodb://127.0.0.1:27017');
const db = client.db('elliptical');
const rooms = db.collection('rooms');
const adminpass = db.collection('admin-password');

// Initalize server stuff
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const __dirname = url.fileURLToPath(new URL('./', import.meta.url));
const context = {
    LOCKED: false,
    ONLINE: 0,
    PASSWORD: 'changeme', // Should probably move this to a .env file later and make it unchangeable
    MAX_ROOMS: 25,
    BLOCKED: [
        'example'
    ]
}

// Build the frontend
await build();
console.log('✅ Successfully built frontend');

app.use(express.static('dist'));
app.use((req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const password = async () => {
    const result = await adminpass.findOne({ id: 'admin' });

    if (result) return context.PASSWORD = result.password;

    adminpass.insertOne({
        id: 'admin',
        password: context.PASSWORD
    });
}

const getroom = async (socket) => {
    const result = rooms.find({}, {
        projection: {
            _id: 0
        }
    });

    for await (const room of result) {
        if (room.data === 'room') socket.emit('room', room);
        else socket.emit('room', {
            highlight: room.highlight,
            title: room.title,
            id: room.roomid
        });
    }
}

const get = async (socket, id) => {
    try {
        const room = await rooms.findOne({ roomid: id });

        if (!room || !room.messages) return;

        for (const message of room.messages) {
            if (message.data === 'message') socket.emit('message', message);
            else socket.emit('message', message);
        }
    } catch (error) {
        console.warn('❌ Error! ' + error);
    }
}

const executeUserInput = async (input) => {
    try {
        const command = input.command;

        if (command.charAt(0) === 'm') io.emit('event', {
            message: `Server: ${command.substring(2)}`
        });
        else if (command == 'lockall') {
            io.emit('event', {
                message: 'Chat has been locked',
                status: 1
            });
            console.log('🔒 All chats locked!');

            context.LOCKED = true;
        } else if (command == 'unlockall') {
            io.emit('event', {
                message: 'Chat has been unlocked'
            });
            console.log('🔓 All chats unlocked!');

            context.LOCKED = false;
        } else if (command == 'refresh') io.emit('reload', '');
        else if (command == 'purge') {
            rooms.deleteMany({});

            io.emit('purge');
        } else if (command == 'eval') {
            console.log('🔁 Running eval...');

            eval(input + '()');
        } else if (command.includes('opentab')) { // Should probably remove this as it is a security risk
            let message = command.substring(7);

            io.emit('opentab', message);
        } else if (command == 'deletemsg') {
            await rooms.updateOne({
                roomid: input.roomid
            }, {
                $pull: {
                    messages: {
                        msgid: input.msgid
                    }
                }
            });

            io.to(input.roomid).emit('delete', {
                type: 'message',
                id: input.msgid
            });
        } else if (command == 'deleteroom') {
            await rooms.deleteOne({ roomid: input.roomid });

            io.to('home').emit('delete', {
                type: 'room',
                id: input.roomid
            });
        } else if (command == 'highlight') { // Highlight messages in a room
            if (!input.roomid) return;

            if (input.message) {
                const id = uuid();

                await rooms.updateOne({
                    roomid: input.roomid
                }, {
                    $push: {
                        messages: {
                            message,
                            msgid: id,
                            highlight: true
                        }
                    }
                });

                io.to(input.roomid).emit('message', {
                    message: input.message,
                    id,
                    highlight: true
                });
            } else {
                await rooms.updateOne({ roomid: input.roomid }, {
                    $set: {
                        highlight: true
                    }
                });

                const room = await rooms.findOne({ roomid: input.roomid });

                io.to('home').emit('room', {
                    title: room.title,
                    id: room.roomid,
                    highlight: true,
                    update: true
                });
            }
        } else console.log('❌ An invalid command was provided:', command);
    } catch (error) {
        console.warn('❌ Error!', error);
    }
}

// Handle socket.io events
io.on('connection', async (socket) => {
    console.log('📥 New user connected with id', socket.id);

    socket.join('home');
    context.ONLINE++;
    io.emit('users', context.ONLINE);
    getroom(socket);

    socket.on('message', async ({ roomid, message }) => {
        const filtermsgspace = message.replaceAll(' ', '');
        const filtermsgcaps = filtermsgspace.toLowerCase();
        const messageIncludesBlockedTerm = context.BLOCKED.some((term) => filtermsgcaps.includes(term));

        // Emit a warning or take other appropriate action
        if (messageIncludesBlockedTerm) socket.emit('event', {
            message: 'Message contains a blocked phrase',
            status: 2
        });
        else if (context.LOCKED) socket.emit('event', {
            message: 'Chat has been locked',
            status: 1
        });
        else {
            if (message.length >= 200) {
                socket.emit('event', {
                    message: 'Too many characters in message (200 max)',
                    status: 2
                });
            } else {
                const id = uuid();

                await rooms.updateOne({
                    roomid
                }, {
                    $push: {
                        messages: {
                            message,
                            msgid: id
                        }
                    }
                });

                io.emit('message', {
                    message,
                    id
                });
            }
        }
    });

    socket.on('room', async (msg) => {
        if (typeof msg !== 'string') return;

        const messageIncludesBlockedTerm = context.BLOCKED.some((term) => msg.replaceAll(' ', '').toLowerCase().includes(term));
        const roomCount = await rooms.countDocuments();

        if (messageIncludesBlockedTerm) socket.emit('event', {
            message: 'Room name contains a blocked phrase',
            status: 2
        });
        else if (context.LOCKED == true) socket.emit('event', {
            message: 'Chat has been locked',
            status: 1
        });
        else if (roomCount >= context.MAX_ROOMS) socket.emit('event', {
            message: 'Too many rooms',
            status: 2
        });
        else {
            if (msg.length >= 25) socket.emit('event', {
                message: 'Too many characters in room name (25 max)',
                status: 2
            });
            else {
                const id = uuid();

                await rooms.insertOne({
                    title: msg,
                    roomid: id,
                    messages: []
                });

                io.to('home').emit('room', {
                    title: msg,
                    id
                });
            }
        }
    });

    socket.on('joinroom', async (id) => {
        try {
            socket.join(id);
            socket.emit('joined', id);
            get(socket, id);
        } catch (e) {
            console.warn('❌ Error!', e);
        }
    });

    socket.on('disconnect', () => {
        context.ONLINE--;
        io.emit('users', context.ONLINE);
    });

    socket.on('admin handler', (msg) => {
        if (msg.adminpass.includes(context.PASSWORD)) executeUserInput(msg);
        else console.log('❌ Invalid admin password attempt: ' + msg.adminpass);
    });

    socket.on('passchange', (msg) => {
        if (msg.adminpass.includes(context.PASSWORD)) {
            adminpass.updateOne({
                id: 'admin'
            }, {
                $set: {
                    password: msg.newpass
                }
            });

            context.PASSWORD = msg.newpass;
            socket.emit('event', {
                message: 'Success'
            });

            console.log('✅ Password changed to: ' + msg.newpass);
        } else console.log('❌ Invalid admin password attempt: ' + msg.adminpass);
    });

    socket.on('updateMaxRooms', (msg) => {
        if (msg.adminpass.includes(context.PASSWORD)) {
            context.MAX_ROOMS = msg.maxRooms;

            socket.emit('event', {
                message: 'Success'
            });

            console.log('✅ Max rooms updated to: ' + context.MAX_ROOMS);
        } else console.log('❌ Invalid admin password attempt: ' + msg.adminpass);
    });
});

// Connect to the database
try {
    await client.connect();

    console.log('✅ Connected to MongoDB');

    password();
} catch (error) {
    console.error('❌ Error connecting to MongoDB', error);
}

// Start the server
server.listen(3000, () => console.log('✅ Elliptical server running at http://localhost:3000'));


// Create a simple command line interface for executing commands
const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

const command = () => rl.question('✅ Ready for chat commands\n', (input) => {
    executeUserInput({ command: input }); // Execute your function
    command();
});

command();