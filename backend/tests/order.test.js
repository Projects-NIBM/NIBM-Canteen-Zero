const Order = require('../models/Order');

describe('Order Fulfillment Calculations', () => {
    test('Should calculate total amount based on quantity', () => {
        const items = [
            { price: 100, quantity: 2 },
            { price: 50, quantity: 1 }
        ];
        const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        expect(total).toBe(250);
    });

    test('Should generate 4-digit numeric tokens', () => {
        const token = Math.floor(1000 + Math.random() * 9000).toString();
        expect(token.length).toBe(4);
        expect(Number(token)).toBeGreaterThan(999);
    });
});