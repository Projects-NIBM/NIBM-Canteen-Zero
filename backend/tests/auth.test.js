const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const authRoutes = require('../routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Identity Management Logic', () => {
    test('Should reject non-NIBM email domains', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: "Hacker",
                email: "hacker@gmail.com",
                password: "password123"
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('Only @nibm.lk emails are permitted');
    });

    test('Should successfully register valid student', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: "Student",
                email: "student@nibm.lk",
                password: "password123"
            });
        expect(res.statusCode).toBe(201);
    });
});