import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Checkout from '../pages/Checkout';

describe('Checkout Gateway', () => {
    test('renders instructions', () => {
        render(<BrowserRouter><Checkout /></BrowserRouter>);
        expect(screen.getByText(/Scan with Banking App/i)).toBeInTheDocument();
    });
});