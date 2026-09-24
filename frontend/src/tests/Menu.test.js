import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Menu from '../pages/Menu';
import API from '../services/api';

jest.mock('../services/api');

describe('Student Menu Dashboard', () => {
    test('renders academic selection header', async () => {
        API.get.mockResolvedValue({ data: [] });
        render(<BrowserRouter><Menu /></BrowserRouter>);
        await waitFor(() => {
            expect(screen.getByText(/Academic Selection/i)).toBeInTheDocument();
        });
    });
});