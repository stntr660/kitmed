import React from 'react';
import { screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProductCard } from '@/components/products/product-card';
import { renderWithProviders } from '../../utils/test-helpers';
import { mockProducts } from '../../fixtures/mock-data';

expect.extend(toHaveNoViolations);

describe('ProductCard Component', () => {
  const mockProduct = mockProducts[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders product information correctly', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      
      expect(screen.getByText(mockProduct.name.en)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.shortDescription?.en || mockProduct.description.en)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.manufacturer.name)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.category.name.en)).toBeInTheDocument();
    });

    it('renders product image with correct alt text', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', mockProduct.images[0].alt.en);
      expect(image).toHaveAttribute('src', expect.stringContaining(mockProduct.images[0].url));
    });

    it('renders featured badge for featured products', () => {
      const featuredProduct = { ...mockProduct, featured: true };
      renderWithProviders(<ProductCard product={featuredProduct} />);
      
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('does not render featured badge for non-featured products', () => {
      const regularProduct = { ...mockProduct, featured: false };
      renderWithProviders(<ProductCard product={regularProduct} />);
      
      expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });

    it('renders price information when available', () => {
      const productWithPrice = {
        ...mockProduct,
        price: { currency: 'USD', amount: 25000, type: 'fixed' as const },
      };
      renderWithProviders(<ProductCard product={productWithPrice} />);
      
      expect(screen.getByText('$25,000')).toBeInTheDocument();
    });

    it('renders quote request for quote-based pricing', () => {
      const quoteProduct = {
        ...mockProduct,
        price: { currency: 'USD', amount: 0, type: 'quote' as const },
      };
      renderWithProviders(<ProductCard product={quoteProduct} />);
      
      expect(screen.getByText('Request Quote')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onViewDetails when view details button is clicked', async () => {
      const onViewDetails = jest.fn();
      const { user } = renderWithProviders(
        <ProductCard product={mockProduct} onViewDetails={onViewDetails} />
      );
      
      const viewButton = screen.getByRole('button', { name: /view details/i });
      await user.click(viewButton);
      
      expect(onViewDetails).toHaveBeenCalledWith(mockProduct);
    });

    it('calls onAddToRfp when add to RFP button is clicked', async () => {
      const onAddToRfp = jest.fn();
      const { user } = renderWithProviders(
        <ProductCard product={mockProduct} onAddToRfp={onAddToRfp} />
      );
      
      const addButton = screen.getByRole('button', { name: /add to rfp/i });
      await user.click(addButton);
      
      expect(onAddToRfp).toHaveBeenCalledWith(mockProduct);
    });

    it('shows loading state when adding to RFP', async () => {
      const onAddToRfp = jest.fn().mockResolvedValue(undefined);
      const { user } = renderWithProviders(
        <ProductCard product={mockProduct} onAddToRfp={onAddToRfp} />
      );
      
      const addButton = screen.getByRole('button', { name: /add to rfp/i });
      await user.click(addButton);
      
      expect(screen.getByText(/adding/i)).toBeInTheDocument();
    });
  });

  describe('Localization', () => {
    it('renders French content when locale is fr', () => {
      renderWithProviders(<ProductCard product={mockProduct} />, { locale: 'fr' });
      
      expect(screen.getByText(mockProduct.name.fr)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.category.name.fr)).toBeInTheDocument();
    });

    it('uses French image alt text in French locale', () => {
      renderWithProviders(<ProductCard product={mockProduct} />, { locale: 'fr' });
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', mockProduct.images[0].alt.fr);
    });
  });

  describe('Edge Cases', () => {
    it('handles product without images gracefully', () => {
      const productNoImages = { ...mockProduct, images: [] };
      renderWithProviders(<ProductCard product={productNoImages} />);
      
      expect(screen.getByText(mockProduct.name.en)).toBeInTheDocument();
      // Should render placeholder or no-image state
    });

    it('handles very long product names', () => {
      const longNameProduct = {
        ...mockProduct,
        name: {
          en: 'A Very Long Product Name That Should Be Truncated Properly Without Breaking Layout',
          fr: 'Un nom de produit très long qui devrait être tronqué correctement sans casser la mise en page',
        },
      };
      renderWithProviders(<ProductCard product={longNameProduct} />);
      
      expect(screen.getByText(longNameProduct.name.en)).toBeInTheDocument();
    });

    it('handles missing price information', () => {
      const noPriceProduct = { ...mockProduct, price: undefined };
      renderWithProviders(<ProductCard product={noPriceProduct} />);
      
      expect(screen.getByText(mockProduct.name.en)).toBeInTheDocument();
      expect(screen.queryByText('$')).not.toBeInTheDocument();
    });

    it('handles products with inactive status', () => {
      const inactiveProduct = { ...mockProduct, status: 'inactive' as const };
      renderWithProviders(<ProductCard product={inactiveProduct} />);
      
      // Should show inactive status or not render Add to RFP button
      const addButton = screen.queryByRole('button', { name: /add to rfp/i });
      expect(addButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = renderWithProviders(<ProductCard product={mockProduct} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels for buttons', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      
      const viewButton = screen.getByRole('button', { name: /view details/i });
      const addButton = screen.getByRole('button', { name: /add to rfp/i });
      
      expect(viewButton).toHaveAttribute('aria-label', expect.stringContaining(mockProduct.name.en));
      expect(addButton).toHaveAttribute('aria-label', expect.stringContaining(mockProduct.name.en));
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      
      const productName = screen.getByRole('heading', { level: 3 });
      expect(productName).toHaveTextContent(mockProduct.name.en);
    });

    it('supports keyboard navigation', async () => {
      const onViewDetails = jest.fn();
      const onAddToRfp = jest.fn();
      const { user } = renderWithProviders(
        <ProductCard 
          product={mockProduct} 
          onViewDetails={onViewDetails}
          onAddToRfp={onAddToRfp}
        />
      );
      
      // Tab to view details button
      await user.tab();
      expect(screen.getByRole('button', { name: /view details/i })).toHaveFocus();
      
      // Enter should trigger action
      await user.keyboard('{Enter}');
      expect(onViewDetails).toHaveBeenCalledWith(mockProduct);
      
      // Tab to add to RFP button
      await user.tab();
      expect(screen.getByRole('button', { name: /add to rfp/i })).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('renders within performance threshold', async () => {
      const renderTime = await measureRenderTime(async () => {
        renderWithProviders(<ProductCard product={mockProduct} />);
      });
      
      // Product card should render quickly (< 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('handles large product specifications efficiently', () => {
      const productWithManySpecs = {
        ...mockProduct,
        specifications: Array.from({ length: 50 }, (_, i) => ({
          id: `spec-${i}`,
          name: { en: `Specification ${i}`, fr: `Spécification ${i}` },
          value: { en: `Value ${i}`, fr: `Valeur ${i}` },
          category: 'Performance',
          order: i,
        })),
      };
      
      const { container } = renderWithProviders(<ProductCard product={productWithManySpecs} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Security', () => {
    it('sanitizes HTML in product descriptions', () => {
      const maliciousProduct = {
        ...mockProduct,
        description: {
          en: '<script>alert("xss")</script>Safe description',
          fr: '<script>alert("xss")</script>Description sûre',
        },
      };
      
      renderWithProviders(<ProductCard product={maliciousProduct} />);
      
      // Script should not be executed
      expect(screen.queryByText('<script>')).not.toBeInTheDocument();
      expect(screen.getByText('Safe description')).toBeInTheDocument();
    });

    it('handles malicious image URLs safely', () => {
      const maliciousImageProduct = {
        ...mockProduct,
        images: [{
          ...mockProduct.images[0],
          url: 'javascript:alert("xss")',
        }],
      };
      
      renderWithProviders(<ProductCard product={maliciousImageProduct} />);
      
      const image = screen.getByRole('img');
      expect(image).not.toHaveAttribute('src', 'javascript:alert("xss")');
    });
  });
});

// Helper function for performance testing
async function measureRenderTime(renderFn: () => void): Promise<number> {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
}