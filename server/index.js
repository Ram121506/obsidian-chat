const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev, restrict in prod
        methods: ["GET", "POST"]
    }
});

// Basic Route
app.get('/', (req, res) => {
    res.send('Secure Chat Server is Running');
});

// Socket.IO Logic
let onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // User comes online and sends their Public Key
    socket.on('register_user', (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log(`User ${userId} registered online`);
        io.emit('user_status', Array.from(onlineUsers.keys()));
    });

    socket.on('store_public_key', ({ userId, publicKey }) => {
        // In a real app, save to DB. For now, we broadcast it to who needs it or just log it.
        // We will store it in the in-memory users list or better, update the DB file.
        const users = require('./db/users.json');
        const fs = require('fs');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].publicKey = publicKey;
            fs.writeFileSync('./db/users.json', JSON.stringify(users, null, 2));
            console.log(`Public Key stored for ${userId}`);
        }
    });

    socket.on('send_message', (data) => {
        // data = { from, to, encryptedPackage, timestamp }
        const messages = require('./db/messages.json');
        const fs = require('fs');

        messages.push(data);
        fs.writeFileSync('./db/messages.json', JSON.stringify(messages, null, 2));

        const recipientSocketId = onlineUsers.get(data.to);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('receive_message', data);
        }
    });

    // --- Friend Request Logic ---

    // Helper to get fresh data
    const getUsers = () => {
        try {
            const data = fs.readFileSync('./db/users.json', 'utf8');
            return JSON.parse(data);
        } catch (e) { return []; }
    };

    const saveUsers = (users) => {
        fs.writeFileSync('./db/users.json', JSON.stringify(users, null, 2));
    };

    socket.on('search_users', (query) => {
        const users = getUsers();
        // Simple case-insensitive search
        const matches = users
            .filter(u => u.username.toLowerCase().includes(query.toLowerCase()))
            .map(u => ({ id: u.id, username: u.username, avatar: u.avatar }));

        socket.emit('search_results', matches);
    });

    socket.on('send_friend_request', ({ from, to }) => {
        const users = getUsers();
        const target = users.find(u => u.id === to);
        const sender = users.find(u => u.id === from);

        if (target && sender) {
            target.requests = target.requests || [];
            // Prevent duplicate requests
            if (!target.requests.find(r => r.id === from) && (!target.friends || !target.friends.find(f => f === from))) {
                target.requests.push({ id: sender.id, username: sender.username, avatar: sender.avatar });
                saveUsers(users);

                const targetSocket = onlineUsers.get(to);
                if (targetSocket) {
                    io.to(targetSocket).emit('friend_request_received', { id: sender.id, username: sender.username, avatar: sender.avatar });
                }
            }
        }
    });

    socket.on('accept_friend_request', ({ userId, requesterId }) => {
        const users = getUsers();
        const user = users.find(u => u.id === userId);
        const requester = users.find(u => u.id === requesterId);

        if (user && requester) {
            // Add to friends lists (Initialize if undefined)
            user.friends = user.friends || [];
            requester.friends = requester.friends || [];

            if (!user.friends.includes(requesterId)) user.friends.push(requesterId);
            if (!requester.friends.includes(userId)) requester.friends.push(userId);

            // Remove from requests
            user.requests = (user.requests || []).filter(r => r.id !== requesterId);

            saveUsers(users);

            // Notify both
            const requesterSocket = onlineUsers.get(requesterId);
            if (requesterSocket) io.to(requesterSocket).emit('request_accepted', { id: user.id, username: user.username });

            socket.emit('request_accepted', { id: requester.id, username: requester.username });
        }
    });

    socket.on('reject_friend_request', ({ userId, requesterId }) => {
        const users = getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.requests = (user.requests || []).filter(r => r.id !== requesterId);
            saveUsers(users);
            socket.emit('request_rejected', requesterId);
        }
    });

    socket.on('disconnect', () => {
        // Find user by socketId and remove
        for (let [uid, sid] of onlineUsers.entries()) {
            if (sid === socket.id) {
                onlineUsers.delete(uid);
                break;
            }
        }
        io.emit('user_status', Array.from(onlineUsers.keys()));
        console.log('User Disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
