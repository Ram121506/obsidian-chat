const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const USERS_FILE = path.join(__dirname, '../db/users.json');

// Helper to read/write users
const getUsers = () => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const saveUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const users = getUsers();

        if (users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);

        const token = jwt.sign({ id: newUser.id, username: newUser.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.status(201).json({
            token,
            user: { id: newUser.id, username: newUser.username, email: newUser.email, avatar: newUser.avatar }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = getUsers();

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.json({
            token,
            user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUsers = (req, res) => {
    try {
        const users = getUsers();
        // Return public info only
        const publicUsers = users.map(u => ({
            id: u.id,
            username: u.username,
            avatar: u.avatar,
            publicKey: u.publicKey
        }));
        res.json(publicUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};
