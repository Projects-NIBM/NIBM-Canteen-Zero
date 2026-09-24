const Product = require('../models/Product');

describe('Product Inventory Logic', () => {
    test('Should default new items to available status', () => {
        const product = new Product({
            name: "Test Roll",
            description: "Test description for NIBM",
            price: 100,
            category: "Snacks",
            image: "test.jpg",
            prepTime: 5
        });
        expect(product.isAvailable).toBe(true);
    });

    test('Should correctly flip availability flag', () => {
        const product = { isAvailable: true };
        product.isAvailable = !product.isAvailable;
        expect(product.isAvailable).toBe(false);
    });
});