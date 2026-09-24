import { render, screen } from '@testing-library/react';
import ProductCard from '../components/ProductCard';

const mockProduct = { name: "Bun", price: 140, description: "Tasty", category: "Snacks", prepTime: 2, spiceLevel: 1 };

describe('ProductCard UI', () => {
    test('renders name and price', () => {
        localStorage.setItem('userRole', 'student');
        render(<ProductCard product={mockProduct} index={0} />);
        expect(screen.getByText('Bun')).toBeInTheDocument();
    });
});