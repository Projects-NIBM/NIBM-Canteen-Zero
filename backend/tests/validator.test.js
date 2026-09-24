const { validateProduct } = require('../middleware/validator');

describe('Data Integrity: Joi Validator', () => {
    test('Should fail if price is a negative number', () => {
        const badData = JSON.stringify({ name: "Bun", price: -100, category: "Snacks", prepTime: 5 });
        const mockReq = { body: { data: badData } };
        const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        
        validateProduct(mockReq, mockRes, () => {});
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });
});