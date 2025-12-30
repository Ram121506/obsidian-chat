const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const USERS_FILE = path.join(__dirname, '../db/users.json');

const getUsers = () => {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch { return []; }
};

const saveUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

exports.googleLogin = async (req, res) => {
    const { token } = req.body;
    try {
        // Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        const { sub, email, name, picture } = payload;

        let users = getUsers();
        let user = users.find(u => u.email === email);

        if (!user) {
            // Create new user from Google profile
            user = {
                id: Date.now().toString(),
                username: name,
                email: email,
                password: '', // No password for Google users
                avatar: picture,
                googleId: sub,
                createdAt: new Date().toISOString()
            };
            users.push(user);
            saveUsers(users);
        }

        // Generate our own JWT
        const appToken = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.json({
            token: appToken,
            user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar }
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(400).json({ message: "Google Authentication Failed" });
    }
};
