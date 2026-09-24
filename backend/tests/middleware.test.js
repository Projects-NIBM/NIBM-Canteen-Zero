const { protect } = require('../middleware/authMiddleware');

describe('Security Middleware: JWT Guard', () => {
    let mockReq, mockRes, nextFunction;

    beforeEach(() => {
        mockReq = { headers: {} };
        mockRes = { 
            status: jest.fn().mockReturnThis(), 
            json: jest.fn() 
        };
        nextFunction = jest.fn();
    });

    test('Should block request if no token is provided', () => {
        protect(mockReq, mockRes, nextFunction);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
    });

    test('Should block request if token is malformed', () => {
        mockReq.headers.authorization = 'Bearer invalidtoken';
        protect(mockReq, mockRes, nextFunction);
        expect(mockRes.status).toHaveBeenCalledWith(401);
    });
});