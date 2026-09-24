import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

describe('Login Page Layout', () => {
    test('should render portal titles correctly', () => {
        render(<BrowserRouter><Login /></BrowserRouter>);
        expect(screen.getByText(/CANTEEN-ZERO/i)).toBeInTheDocument();
        expect(screen.getByText(/Student Login/i)).toBeInTheDocument();
    });
});