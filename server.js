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
const adminPassword = '298612'; // Passwort für den Admin-Account
let adminUserId = null;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('setUsername', (username, password) => {
        if (password === adminPassword) {
            adminUserId = socket.id; // Setze den Admin-User
            users[socket.id] = `${username} (ADMIN)`;
        } else {
            users[socket.id] = username;
        }
        socket.emit('chatHistory', messages);
        console.log(`${username} has joined the chat.`);
    });

    socket.on('chatMessage', (msg) => {
        const message = {
            username: users[socket.id],
            text: msg,
            time: new Date().toLocaleTimeString()
        };

        // Check for bot commands
        if (msg.startsWith('!') && socket.id === adminUserId) {
            handleCommand(msg, socket);
        } else {
            messages.push(message);
            io.emit('message', message);
        }
    });

    socket.on('disconnect', () => {
        console.log(`${users[socket.id]} has left the chat.`);
        delete users[socket.id];
        if (socket.id === adminUserId) {
            adminUserId = null; // Setze den Admin-User zurück, wenn er sich trennt
        }
    });
});

// Handle bot commands
function handleCommand(command, socket) {
    switch (command) {
        case '!clear-chat':
            messages = []; // Clear the chat messages
            io.emit('chatCleared'); // Notify all clients
            sendSystemMessage("Der Chat wurde erfolgreich gelöscht."); // Send system message
            break;
        default:
            break;
    }
}

// Send a system message
function sendSystemMessage(text) {
    const systemMessage = {
        username: 'System Bot (OFFIZIELL)', // Bot name with badge
        text: text,
        time: new Date().toLocaleTimeString()
    };
    messages.push(systemMessage);
    io.emit('message', systemMessage); // Send system message to all clients
}

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
