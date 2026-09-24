import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../pages/Profile';
import '@testing-library/jest-dom';

describe('Profile Page Role Awareness', () => {
    test('should display student heading for student role', () => {
        localStorage.setItem('userRole', 'student');
        render(<BrowserRouter><Profile /></BrowserRouter>);
        
        expect(screen.getByText(/Identity Settings/i)).toBeInTheDocument();
        expect(screen.getByText(/Student Account/i)).toBeInTheDocument();
    });
});