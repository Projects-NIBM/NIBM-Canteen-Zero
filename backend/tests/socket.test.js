const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

describe('Real-time Event Engine', () => {
    let io, server, clientSocket;

    beforeAll((done) => {
        server = http.createServer();
        io = new Server(server);
        server.listen(() => {
            const port = server.address().port;
            clientSocket = new Client(`http://localhost:${port}`);
            clientSocket.on('connect', done);
        });
    });

    afterAll(() => {
        io.close();
        clientSocket.close();
        server.close();
    });

    test('Should broadcast "orderUpdate" event to specific students', (done) => {
        clientSocket.on('orderUpdate', (data) => {
            expect(data.status).toBe('Ready');
            expect(data.tokenID).toBe('7558');
            done();
        });

        io.emit('orderUpdate', { status: 'Ready', tokenID: '7558' });
    });
});