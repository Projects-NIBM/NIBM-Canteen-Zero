const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/'
};

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, role: user.role, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = crypto.randomBytes(40).toString('hex');
    return { accessToken, refreshToken };
};

router.post('/register', async (req, res, next) => {
    const { name, email, password, role } = req.body;
    if (!email || !email.toLowerCase().endsWith('@nibm.lk')) {
        return res.status(400).json({ message: "Only @nibm.lk emails are permitted." });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ 
            name, 
            email, 
            password: hashedPassword, 
            role: role || 'student' 
        });
        await newUser.save();
        res.status(201).json({ message: "Account created successfully." });
    } catch (err) {
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Account not found." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

        const { accessToken, refreshToken } = generateTokens(user);

        await RefreshToken.create({
            token: refreshToken,
            user: user._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({
            token: accessToken,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone || "" }
        });
    } catch (err) {
        next(err);
    }
});

router.post('/refresh', async (req, res, next) => {
    const incomingRefreshToken = req.cookies?.refreshToken;
    if (!incomingRefreshToken) {
        return res.status(401).json({ message: "No refresh token provided." });
    }

    try {
        const savedToken = await RefreshToken.findOne({ token: incomingRefreshToken });
        if (!savedToken) {
            res.clearCookie('accessToken', COOKIE_OPTIONS);
            res.clearCookie('refreshToken', COOKIE_OPTIONS);
            return res.status(403).json({ message: "Invalid or revoked refresh token." });
        }

        const user = await User.findById(savedToken.user);
        if (!user) return res.status(404).json({ message: "User not found." });

        await RefreshToken.deleteOne({ _id: savedToken._id });

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        await RefreshToken.create({
            token: newRefreshToken,
            user: user._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', newRefreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({ token: accessToken, message: "Session prolonged successfully." });
    } catch (err) {
        next(err);
    }
});

router.post('/logout', async (req, res, next) => {
    try {
        const incomingRefreshToken = req.cookies?.refreshToken;
        if (incomingRefreshToken) {
            await RefreshToken.deleteOne({ token: incomingRefreshToken });
        }
        res.clearCookie('accessToken', COOKIE_OPTIONS);
        res.clearCookie('refreshToken', COOKIE_OPTIONS);
        res.json({ message: "Logged out successfully." });
    } catch (err) {
        next(err);
    }
});

router.get('/me', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: "User profile not found." });
        res.json({ user });
    } catch (err) {
        next(err);
    }
});

router.put('/profile/:id', protect, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized profile modification." });
        }
        const { phone } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { phone }, { new: true });
        res.json({ message: "Profile updated", user: { name: user.name, phone: user.phone } });
    } catch (err) {
        next(err);
    }
});

router.put('/change-password/:id', protect, async (req, res, next) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ message: "Unauthorized password modification." });
        }
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.params.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Current password incorrect." });
        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();
        res.json({ message: "Password updated successfully." });
    } catch (err) {
        next(err);
    }
});

module.exports = router;