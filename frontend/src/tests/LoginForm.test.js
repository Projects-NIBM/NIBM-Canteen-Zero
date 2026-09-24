import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from '../components/LoginForm';

describe('LoginForm Unit', () => {
    test('should show error for non-NIBM email', () => {
        render(<LoginForm onLogin={() => {}} error="" loading={false} />);
        const emailInput = screen.getByPlaceholderText(/student_id@nibm.lk/i);
        
        const submitBtn = screen.getByRole('button', { name: /ACCESS PORTAL/i });

        fireEvent.change(emailInput, { target: { value: 'user@gmail.com' } });
        fireEvent.click(submitBtn);

        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    });
});