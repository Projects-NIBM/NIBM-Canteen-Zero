import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';
import API from '../services/api';

jest.mock('../services/api');

describe('Admin Dashboard', () => {
    test('renders main sections', async () => {
        API.get.mockResolvedValue({ data: [] });
        render(<BrowserRouter><AdminDashboard /></BrowserRouter>);
        await waitFor(() => {
            expect(screen.getByText(/Inventory Manager/i)).toBeInTheDocument();
        });
    });
});