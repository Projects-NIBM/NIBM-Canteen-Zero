const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
require('dotenv').config();

const logger = require('./utils/logger');
const { initSeatWorker } = require('./services/seatReleaseWorker');

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_NAME', 'CLOUDINARY_KEY', 'CLOUDINARY_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger.fatal(`Configuration error: missing ${envVar}`);
        process.exit(1);
    }
}

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
        credentials: true
    }
});

const setupRedisAdapter = async () => {
    if (process.env.REDIS_URL) {
        try {
            const pubClient = createClient({ url: process.env.REDIS_URL });
            const subClient = pubClient.duplicate();
            await Promise.all([pubClient.connect(), subClient.connect()]);
            io.adapter(createAdapter(pubClient, subClient));
            logger.info("Socket.IO Redis Adapter initialized for horizontal scaling.");
        } catch (err) {
            logger.error({ error: err.message }, "Redis connection failed. Falling back to in-memory adapter.");
        }
    } else {
        logger.info("Standalone mode active (no REDIS_URL supplied).");
    }
};

io.use((socket, next) => {
    const rawCookie = socket.handshake.headers.cookie;
    let token = null;

    if (rawCookie) {
        const match = rawCookie.split(';').map(c => c.trim()).find(c => c.startsWith('accessToken='));
        if (match) token = match.split('=')[1];
    }

    if (!token && socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
        } catch (err) {}
    }
    next();
});

app.set('socketio', io);

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Rate limit exceeded. Please wait." }
});

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use('/api', apiLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const customSanitize = (req, res, next) => {
    const sanitize = (obj) => {
        if (obj instanceof Object) {
            for (const key in obj) {
                if (key.startsWith('$')) {
                    delete obj[key];
                } else {
                    sanitize(obj[key]);
                }
            }
        }
    };
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    next();
};
app.use(customSanitize);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    logger.error({ error: err.message, stack: err.stack });
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        logger.info("Industrial MongoDB Connected.");
        await setupRedisAdapter();
        initSeatWorker(io);
    })
    .catch((err) => {
        logger.fatal({ error: err.message }, "MongoDB connection failed.");
        process.exit(1);
    });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger.info(`Server operational on port ${PORT}`);
});