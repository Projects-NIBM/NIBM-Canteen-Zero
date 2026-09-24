import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CartDrawer from '../components/CartDrawer';
import { useCartStore } from '../store/useCartStore';

describe('CartDrawer UI', () => {
    test('should show empty state message', () => {
        useCartStore.setState({ isCartOpen: true, cart: [] });
        render(<BrowserRouter><CartDrawer /></BrowserRouter>);
        expect(screen.getByText(/Basket is empty/i)).toBeInTheDocument();
    });
});