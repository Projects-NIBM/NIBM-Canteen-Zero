import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import KitchenMonitor from '../pages/KitchenMonitor';

describe('Kitchen Monitor', () => {
    test('renders queue header', () => {
        render(<BrowserRouter><KitchenMonitor /></BrowserRouter>);
        expect(screen.getByText(/Kitchen Monitor/i)).toBeInTheDocument();
    });
});