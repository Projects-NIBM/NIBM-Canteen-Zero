import { useCartStore } from '../store/useCartStore';

describe('Cart Logic Store', () => {
    test('adds items to basket', () => {
        useCartStore.getState().addToCart({ _id: '1', price: 100 });
        expect(useCartStore.getState().cart.length).toBe(1);
    });
});