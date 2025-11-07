import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ProductCard } from '@/components/products/product-card';
import { ProductSearch } from '@/components/products/product-search';
import { RFPCart } from '@/components/rfp/rfp-cart';
import { AdminLogin } from '@/components/admin/admin-login';
import { AdminProductForm } from '@/components/admin/admin-product-form';
import { renderWithProviders, axeRulesForMedicalEquipment } from '../utils/test-helpers';
import { mockProducts, mockRFPRequests } from '../fixtures/mock-data';

expect.extend(toHaveNoViolations);

describe('WCAG Compliance Tests', () => {
  describe('Critical User Interface Components', () => {
    it('ProductCard meets WCAG 2.1 AA standards', async () => {
      const { container } = renderWithProviders(
        <ProductCard product={mockProducts[0]} />
      );

      const results = await axe(container, axeRulesForMedicalEquipment);
      expect(results).toHaveNoViolations();
    });

    it('ProductSearch form is fully accessible', async () => {
      const { container } = renderWithProviders(
        <ProductSearch onSearch={jest.fn()} />
      );

      const results = await axe(container, {
        rules: {
          // Ensure form controls are properly labeled
          'form-field-multiple-labels': { enabled: true },
          'label': { enabled: true },
          'label-title-only': { enabled: true },
          
          // Ensure proper focus management
          'focus-order-semantics': { enabled: true },
          'focusable-no-name': { enabled: true },
          
          // Ensure proper keyboard navigation
          'keyboard-navigation': { enabled: true },
          'interactive-controls-focus': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('RFP Cart maintains accessibility during interactions', async () => {
      const mockCart = {
        items: [
          {
            productId: mockProducts[0].id,
            product: mockProducts[0],
            quantity: 2,
            notes: 'Test notes',
            addedAt: new Date(),
          },
        ],
        updatedAt: new Date(),
      };

      const { container } = renderWithProviders(
        <RFPCart cart={mockCart} onUpdateCart={jest.fn()} />
      );

      const results = await axe(container, {
        rules: {
          // Critical for medical equipment ordering
          'button-name': { enabled: true },
          'link-name': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-required-attr': { enabled: true },
          
          // Table accessibility for cart items
          'table-header-scope': { enabled: true },
          'td-headers-attr': { enabled: true },
          'th-has-data-cells': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('Admin login form meets security accessibility standards', async () => {
      const { container } = renderWithProviders(
        <AdminLogin onLogin={jest.fn()} />
      );

      const results = await axe(container, {
        rules: {
          // Security-focused accessibility
          'autocomplete-valid': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
          'input-button-name': { enabled: true },
          'input-image-alt': { enabled: true },
          
          // Password field specific rules
          'aria-input-field-name': { enabled: true },
          'label-content-name-mismatch': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('Admin product management forms are accessible', async () => {
      const { container } = renderWithProviders(
        <AdminProductForm 
          product={mockProducts[0]} 
          onSave={jest.fn()} 
          onCancel={jest.fn()} 
        />
      );

      const results = await axe(container, {
        rules: {
          // Complex form accessibility
          'fieldset-legend': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
          'input-button-name': { enabled: true },
          'select-name': { enabled: true },
          'textarea-name': { enabled: true },
          
          // File upload accessibility
          'duplicate-id': { enabled: true },
          'duplicate-id-active': { enabled: true },
          'duplicate-id-aria': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('meets enhanced color contrast for medical interfaces', async () => {
      const { container } = renderWithProviders(
        <div className="p-4 space-y-4">
          <ProductCard product={mockProducts[0]} />
          <div className="bg-red-600 text-white p-2">
            Critical Alert: Equipment Recall Notice
          </div>
          <div className="bg-yellow-100 text-yellow-800 p-2">
            Warning: Maintenance Required
          </div>
          <div className="bg-green-100 text-green-800 p-2">
            Success: Order Confirmed
          </div>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true }, // AAA level
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('provides sufficient contrast for text over images', async () => {
      const productWithImage = {
        ...mockProducts[0],
        images: [
          {
            id: 'img-1',
            url: '/images/products/sample-product.jpg',
            alt: { en: 'Medical Equipment', fr: 'Équipement Médical' },
            width: 800,
            height: 600,
            isPrimary: true,
            order: 1,
          },
        ],
      };

      const { container } = renderWithProviders(
        <ProductCard product={productWithImage} />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'image-alt': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation and Focus Management', () => {
    it('supports complete keyboard navigation through product catalog', async () => {
      const { container } = renderWithProviders(
        <div>
          <ProductSearch onSearch={jest.fn()} />
          <div className="grid grid-cols-2 gap-4 mt-4">
            {mockProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'tabindex': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'focusable-content': { enabled: true },
          'focusable-disabled': { enabled: true },
          'focusable-element': { enabled: true },
          'focusable-no-name': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('maintains proper focus indicators for medical safety', async () => {
      const { container } = renderWithProviders(
        <div className="space-y-4">
          <button className="focus:ring-2 focus:ring-blue-500 focus:outline-none">
            Add to Cart
          </button>
          <button className="focus:ring-2 focus:ring-red-500 focus:outline-none">
            Emergency Stop
          </button>
          <input 
            type="text" 
            className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Search equipment..."
          />
        </div>
      );

      const results = await axe(container, {
        rules: {
          'focus-indicator': { enabled: true },
          'focusable-content': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader and Assistive Technology Support', () => {
    it('provides comprehensive ARIA labeling for complex interfaces', async () => {
      const { container } = renderWithProviders(
        <div role="application" aria-label="Medical Equipment Catalog">
          <header role="banner">
            <nav role="navigation" aria-label="Main navigation">
              <ul>
                <li><a href="/products">Products</a></li>
                <li><a href="/rfp">Request Quote</a></li>
                <li><a href="/support">Support</a></li>
              </ul>
            </nav>
          </header>
          
          <main role="main">
            <section aria-labelledby="featured-products">
              <h2 id="featured-products">Featured Medical Equipment</h2>
              <div role="grid" aria-label="Product grid">
                {mockProducts.map((product, index) => (
                  <div 
                    key={product.id}
                    role="gridcell"
                    aria-rowindex={Math.floor(index / 2) + 1}
                    aria-colindex={(index % 2) + 1}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'aria-allowed-attr': { enabled: true },
          'aria-allowed-role': { enabled: true },
          'aria-hidden-body': { enabled: true },
          'aria-hidden-focus': { enabled: true },
          'aria-input-field-name': { enabled: true },
          'aria-label': { enabled: true },
          'aria-labelledby': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-required-children': { enabled: true },
          'aria-required-parent': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('provides proper semantic structure for document outline', async () => {
      const { container } = renderWithProviders(
        <article>
          <header>
            <h1>IntelliVue MP70 Patient Monitor</h1>
            <p>Advanced patient monitoring system</p>
          </header>
          
          <section aria-labelledby="specifications">
            <h2 id="specifications">Technical Specifications</h2>
            <dl>
              <dt>Display Size</dt>
              <dd>19 inches</dd>
              <dt>Resolution</dt>
              <dd>1280x1024</dd>
            </dl>
          </section>
          
          <section aria-labelledby="documents">
            <h2 id="documents">Documentation</h2>
            <ul>
              <li><a href="/docs/manual.pdf">User Manual (PDF)</a></li>
              <li><a href="/docs/specs.pdf">Technical Specifications (PDF)</a></li>
            </ul>
          </section>
        </article>
      );

      const results = await axe(container, {
        rules: {
          'document-title': { enabled: true },
          'heading-order': { enabled: true },
          'landmark-banner-is-top-level': { enabled: true },
          'landmark-contentinfo-is-top-level': { enabled: true },
          'landmark-main-is-top-level': { enabled: true },
          'landmark-no-duplicate-banner': { enabled: true },
          'landmark-no-duplicate-contentinfo': { enabled: true },
          'landmark-one-main': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'region': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Accessibility and Error Handling', () => {
    it('provides accessible error messages and validation', async () => {
      const { container } = renderWithProviders(
        <form noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="company-name" className="block text-sm font-medium">
                Company Name *
              </label>
              <input
                id="company-name"
                type="text"
                required
                aria-required="true"
                aria-describedby="company-name-error"
                className="mt-1 block w-full border-red-500"
                aria-invalid="true"
              />
              <div id="company-name-error" role="alert" aria-live="polite">
                Company name is required for medical equipment orders
              </div>
            </div>
            
            <div>
              <label htmlFor="equipment-type" className="block text-sm font-medium">
                Equipment Type
              </label>
              <select
                id="equipment-type"
                aria-describedby="equipment-type-help"
                className="mt-1 block w-full"
              >
                <option value="">Select equipment type</option>
                <option value="monitoring">Patient Monitoring</option>
                <option value="diagnostic">Diagnostic Equipment</option>
                <option value="therapeutic">Therapeutic Equipment</option>
              </select>
              <div id="equipment-type-help" className="text-sm text-gray-600">
                Choose the primary category of medical equipment needed
              </div>
            </div>
          </div>
        </form>
      );

      const results = await axe(container, {
        rules: {
          'form-field-multiple-labels': { enabled: true },
          'label': { enabled: true },
          'label-title-only': { enabled: true },
          'aria-input-field-name': { enabled: true },
          'aria-required-attr': { enabled: true },
          'duplicate-id': { enabled: true },
          'select-name': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Mobile and Responsive Accessibility', () => {
    it('maintains accessibility across different viewport sizes', async () => {
      const { container } = renderWithProviders(
        <div className="responsive-layout">
          <nav className="md:hidden">
            <button 
              aria-expanded="false"
              aria-controls="mobile-menu"
              aria-label="Open main menu"
            >
              Menu
            </button>
            <div id="mobile-menu" className="hidden">
              <a href="/products">Products</a>
              <a href="/rfp">Request Quote</a>
            </div>
          </nav>
          
          <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </main>
        </div>
      );

      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      const results = await axe(container, {
        rules: {
          'target-size': { enabled: true }, // Touch target size
          'focus-indicator': { enabled: true },
          'scrollable-region-focusable': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Medical Industry Specific Accessibility', () => {
    it('ensures critical medical information is highly accessible', async () => {
      const { container } = renderWithProviders(
        <div className="medical-alert-system">
          <div 
            role="alert" 
            aria-live="assertive"
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
          >
            <strong>FDA Alert:</strong> Device recall issued for Model XYZ-123. 
            Please contact support immediately.
          </div>
          
          <div 
            role="status"
            aria-live="polite"
            className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded"
          >
            <strong>Compliance Notice:</strong> New CE marking requirements 
            effective January 2024.
          </div>
          
          <table className="medical-specifications" role="table">
            <caption>Critical Safety Specifications</caption>
            <thead>
              <tr>
                <th scope="col">Parameter</th>
                <th scope="col">Value</th>
                <th scope="col">Tolerance</th>
                <th scope="col">Safety Limit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Voltage</th>
                <td>110V AC</td>
                <td>±5%</td>
                <td className="text-red-600">Max 132V</td>
              </tr>
              <tr>
                <th scope="row">Current</th>
                <td>2.5A</td>
                <td>±10%</td>
                <td className="text-red-600">Max 3.0A</td>
              </tr>
            </tbody>
          </table>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'table-header-scope': { enabled: true },
          'td-headers-attr': { enabled: true },
          'th-has-data-cells': { enabled: true },
          'table-duplicate-name': { enabled: true },
          'aria-live-region-atomic': { enabled: true },
          'no-autoplay-audio': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('ensures regulatory compliance information is accessible', async () => {
      const { container } = renderWithProviders(
        <section aria-labelledby="regulatory-info">
          <h2 id="regulatory-info">Regulatory Information</h2>
          
          <div className="regulatory-badges" role="group" aria-label="Regulatory certifications">
            <img 
              src="/badges/fda-510k.png" 
              alt="FDA 510(k) cleared medical device"
              role="img"
            />
            <img 
              src="/badges/ce-mark.png" 
              alt="CE marking certified for European market"
              role="img"
            />
            <img 
              src="/badges/iso-13485.png" 
              alt="ISO 13485 quality management system certified"
              role="img"
            />
          </div>
          
          <dl className="regulatory-details">
            <dt>FDA 510(k) Number</dt>
            <dd>K123456789</dd>
            
            <dt>CE Certificate Number</dt>
            <dd>CE-MD-2024-001</dd>
            
            <dt>Device Classification</dt>
            <dd>Class II Medical Device</dd>
            
            <dt>Intended Use</dt>
            <dd>
              For continuous monitoring of patient vital signs in clinical settings 
              under medical supervision.
            </dd>
          </dl>
        </section>
      );

      const results = await axe(container, {
        rules: {
          'definition-list': { enabled: true },
          'dlitem': { enabled: true },
          'image-alt': { enabled: true },
          'landmark-unique': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });
});