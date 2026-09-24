const request = require('supertest');
const express = require('express');

const customSanitize = (req, res, next) => {
    const sanitize = (obj) => {
        if (obj instanceof Object) {
            for (var key in obj) {
                if (key.startsWith('$')) delete obj[key];
                else sanitize(obj[key]);
            }
        }
    };
    sanitize(req.body);
    next();
};

const app = express();
app.use(express.json());
app.use(customSanitize);
app.post('/test', (req, res) => res.json(req.body));

describe('Security Middleware: NoSQL Injection Prevention', () => {
    test('Should remove keys starting with $ from request body', async () => {
        const res = await request(app)
            .post('/test')
            .send({ username: "nethru", password: { "$gt": "" } });
        
        expect(res.body.password).toEqual({});
        expect(res.body.password["$gt"]).toBeUndefined();
    });
});