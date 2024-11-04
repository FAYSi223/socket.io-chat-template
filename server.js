const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

let users = {};
let messages = [];

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('setUsername', (username) => {
        users[socket.id] = username;
        socket.emit('chatHistory', messages);
        console.log(`${username} has joined the chat.`);
    });

    socket.on('chatMessage', (msg) => {
        const message = {
            username: users[socket.id],
            text: msg,
            time: new Date().toLocaleTimeString()
        };
        messages.push(message);
        io.emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log(`${users[socket.id]} has left the chat.`);
        delete users[socket.id];
    });
});
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
