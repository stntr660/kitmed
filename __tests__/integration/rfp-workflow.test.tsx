import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, apiTestHelpers } from '../utils/test-helpers';
import { RFPWorkflow } from '@/components/rfp/rfp-workflow';
import { mockProducts, createMockRFPRequest } from '../fixtures/mock-data';
import { server } from '../utils/msw-server';
import { http, HttpResponse } from 'msw';

describe('RFP Workflow Integration', () => {
  beforeEach(() => {
    // Reset local storage
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Complete RFP Submission Flow', () => {
    it('allows user to complete full RFP submission process', async () => {
      const { user } = renderWithProviders(<RFPWorkflow />);

      // Step 1: Browse and add products to RFP cart
      expect(screen.getByText('Browse Products')).toBeInTheDocument();
      
      // Add first product
      const addButton1 = screen.getAllByRole('button', { name: /add to rfp/i })[0];
      await user.click(addButton1);
      
      await waitFor(() => {
        expect(screen.getByText('1 item in cart')).toBeInTheDocument();
      });

      // Add second product
      const addButton2 = screen.getAllByRole('button', { name: /add to rfp/i })[1];
      await user.click(addButton2);
      
      await waitFor(() => {
        expect(screen.getByText('2 items in cart')).toBeInTheDocument();
      });

      // Step 2: Review cart
      const reviewCartButton = screen.getByRole('button', { name: /review cart/i });
      await user.click(reviewCartButton);

      expect(screen.getByText('RFP Cart Review')).toBeInTheDocument();
      expect(screen.getByText(mockProducts[0].name.en)).toBeInTheDocument();
      expect(screen.getByText(mockProducts[1].name.en)).toBeInTheDocument();

      // Modify quantities
      const quantityInput1 = screen.getAllByLabelText(/quantity/i)[0];
      await user.clear(quantityInput1);
      await user.type(quantityInput1, '3');

      // Add notes
      const notesInput1 = screen.getAllByLabelText(/notes/i)[0];
      await user.type(notesInput1, 'Required for ICU expansion');

      // Step 3: Company information
      const continueButton = screen.getByRole('button', { name: /continue to company info/i });
      await user.click(continueButton);

      expect(screen.getByText('Company Information')).toBeInTheDocument();

      // Fill company details
      await user.type(screen.getByLabelText(/company name/i), 'Metropolitan General Hospital');
      await user.selectOptions(screen.getByLabelText(/company type/i), 'hospital');
      await user.type(screen.getByLabelText(/street address/i), '123 Medical Center Drive');
      await user.type(screen.getByLabelText(/city/i), 'Healthcare City');
      await user.type(screen.getByLabelText(/postal code/i), '12345');
      await user.selectOptions(screen.getByLabelText(/country/i), 'United States');
      await user.type(screen.getByLabelText(/phone/i), '+1-555-0123');
      await user.type(screen.getByLabelText(/website/i), 'https://metrohealth.com');

      // Step 4: Contact information
      const continueToContactButton = screen.getByRole('button', { name: /continue to contact/i });
      await user.click(continueToContactButton);

      expect(screen.getByText('Contact Information')).toBeInTheDocument();

      await user.type(screen.getByLabelText(/first name/i), 'Dr. Sarah');
      await user.type(screen.getByLabelText(/last name/i), 'Wilson');
      await user.type(screen.getByLabelText(/email/i), 'sarah.wilson@metrohealth.com');
      await user.type(screen.getByLabelText(/phone/i), '+1-555-0124');
      await user.type(screen.getByLabelText(/position/i), 'Chief Medical Officer');
      await user.type(screen.getByLabelText(/department/i), 'Administration');

      // Step 5: Project details
      const continueToProjectButton = screen.getByRole('button', { name: /continue to project/i });
      await user.click(continueToProjectButton);

      expect(screen.getByText('Project Details')).toBeInTheDocument();

      await user.type(
        screen.getByLabelText(/project description/i), 
        'Upgrading our critical care monitoring systems to improve patient outcomes.'
      );
      
      await user.selectOptions(screen.getByLabelText(/urgency/i), 'high');
      
      await user.type(screen.getByLabelText(/minimum budget/i), '75000');
      await user.type(screen.getByLabelText(/maximum budget/i), '150000');
      
      await user.type(
        screen.getByLabelText(/delivery requirements/i),
        'Installation and staff training required within 45 days'
      );

      // Step 6: Review and submit
      const reviewSubmitButton = screen.getByRole('button', { name: /review and submit/i });
      await user.click(reviewSubmitButton);

      expect(screen.getByText('Review Your Request')).toBeInTheDocument();

      // Verify all information is displayed correctly
      expect(screen.getByText('Metropolitan General Hospital')).toBeInTheDocument();
      expect(screen.getByText('Dr. Sarah Wilson')).toBeInTheDocument();
      expect(screen.getByText('sarah.wilson@metrohealth.com')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Quantity
      expect(screen.getByText('Required for ICU expansion')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument(); // Urgency
      expect(screen.getByText('$75,000 - $150,000')).toBeInTheDocument();

      // Submit the request
      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Request Submitted Successfully')).toBeInTheDocument();
      });

      // Verify confirmation details
      expect(screen.getByText(/RFP-\d+/)).toBeInTheDocument(); // Request number
      expect(screen.getByText('We will review your request and respond within 24-48 hours')).toBeInTheDocument();
    });

    it('handles cart persistence across page reloads', async () => {
      const { user } = renderWithProviders(<RFPWorkflow />);

      // Add products to cart
      const addButton1 = screen.getAllByRole('button', { name: /add to rfp/i })[0];
      await user.click(addButton1);

      await waitFor(() => {
        expect(screen.getByText('1 item in cart')).toBeInTheDocument();
      });

      // Simulate page reload by remounting component
      const { rerender } = renderWithProviders(<RFPWorkflow />);
      rerender(<RFPWorkflow />);

      // Cart should persist
      await waitFor(() => {
        expect(screen.getByText('1 item in cart')).toBeInTheDocument();
      });
    });

    it('handles form validation errors gracefully', async () => {
      const { user } = renderWithProviders(<RFPWorkflow />);

      // Add product and proceed to company info
      const addButton = screen.getAllByRole('button', { name: /add to rfp/i })[0];
      await user.click(addButton);

      const reviewCartButton = screen.getByRole('button', { name: /review cart/i });
      await user.click(reviewCartButton);

      const continueButton = screen.getByRole('button', { name: /continue to company info/i });
      await user.click(continueButton);

      // Try to proceed without filling required fields
      const continueToContactButton = screen.getByRole('button', { name: /continue to contact/i });
      await user.click(continueToContactButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
        expect(screen.getByText('Street address is required')).toBeInTheDocument();
        expect(screen.getByText('City is required')).toBeInTheDocument();
      });

      // Form should not proceed
      expect(screen.queryByText('Contact Information')).not.toBeInTheDocument();
    });

    it('handles API errors during submission', async () => {
      // Mock API error
      server.use(
        http.post('/api/rfp/submit', () => {
          return HttpResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
            { status: 500 }
          );
        })
      );

      const { user } = renderWithProviders(<RFPWorkflow />);

      // Complete the form quickly
      const addButton = screen.getAllByRole('button', { name: /add to rfp/i })[0];
      await user.click(addButton);

      // Skip to final step (simplified for test)
      const { container } = renderWithProviders(
        <RFPWorkflow initialStep="review" initialData={{
          items: [{ productId: mockProducts[0].id, product: mockProducts[0], quantity: 1, addedAt: new Date() }],
          company: {
            name: 'Test Hospital',
            type: 'hospital',
            address: { street: '123 Test St', city: 'Test City', postalCode: '12345', country: 'US' },
          },
          contact: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
          },
          urgency: 'medium' as const,
        }} />
      );

      const submitButton = screen.getByRole('button', { name: /submit request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Submission Error')).toBeInTheDocument();
        expect(screen.getByText('Internal server error')).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('supports removing items from cart', async () => {
      const { user } = renderWithProviders(<RFPWorkflow />);

      // Add multiple products
      const addButton1 = screen.getAllByRole('button', { name: /add to rfp/i })[0];
      await user.click(addButton1);

      const addButton2 = screen.getAllByRole('button', { name: /add to rfp/i })[1];
      await user.click(addButton2);

      await waitFor(() => {
        expect(screen.getByText('2 items in cart')).toBeInTheDocument();
      });

      // Review cart
      const reviewCartButton = screen.getByRole('button', { name: /review cart/i });
      await user.click(reviewCartButton);

      // Remove first item
      const removeButtons = screen.getAllByRole('button', { name: /remove item/i });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('1 item in cart')).toBeInTheDocument();
      });

      // Verify correct item was removed
      expect(screen.queryByText(mockProducts[0].name.en)).not.toBeInTheDocument();
      expect(screen.getByText(mockProducts[1].name.en)).toBeInTheDocument();
    });
  });

  describe('Cart Management', () => {
    it('prevents duplicate products in cart', async () => {
      const { user } = renderWithProviders(<RFPWorkflow />);

      // Add same product twice
      const addButton = screen.getAllByRole('button', { name: /add to rfp/i })[0];
      await user.click(addButton);
      await user.click(addButton);

      // Should still show only 1 item
      await waitFor(() => {
        expect(screen.getByText('1 item in cart')).toBeInTheDocument();
      });

      // Should show notification about duplicate
      expect(screen.getByText('Product already in cart')).toBeInTheDocument();
    });

    it('handles cart with maximum items limit', async () => {
      const { user } = renderWithProviders(<RFPWorkflow maxCartItems={2} />);

      // Add maximum allowed items
      const addButton1 = screen.getAllByRole('button', { name: /add to rfp/i })[0];
      await user.click(addButton1);

      const addButton2 = screen.getAllByRole('button', { name: /add to rfp/i })[1];
      await user.click(addButton2);

      // Try to add one more (should be prevented)
      const addButton3 = screen.getAllByRole('button', { name: /add to rfp/i })[2];
      if (addButton3) {
        await user.click(addButton3);
        
        // Should show limit notification
        expect(screen.getByText('Cart limit reached (2 items max)')).toBeInTheDocument();
      }

      expect(screen.getByText('2 items in cart')).toBeInTheDocument();
    });
  });

  describe('Accessibility and UX', () => {
    it('maintains proper focus management during navigation', async () => {
      const { user } = renderWithProviders(<RFPWorkflow />);

      // Add product
      const addButton = screen.getAllByRole('button', { name: /add to rfp/i })[0];
      await user.click(addButton);

      // Navigate to cart
      const reviewCartButton = screen.getByRole('button', { name: /review cart/i });
      await user.click(reviewCartButton);

      // Focus should be on main heading
      expect(screen.getByRole('heading', { name: /rfp cart review/i })).toHaveFocus();
    });

    it('provides clear progress indication', async () => {
      const { user } = renderWithProviders(<RFPWorkflow />);

      // Add product and start process
      const addButton = screen.getAllByRole('button', { name: /add to rfp/i })[0];
      await user.click(addButton);

      const reviewCartButton = screen.getByRole('button', { name: /review cart/i });
      await user.click(reviewCartButton);

      // Should show progress indicator
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '5');
    });

    it('supports keyboard navigation throughout the workflow', async () => {
      const { user } = renderWithProviders(<RFPWorkflow />);

      // Should be able to navigate with keyboard
      await user.tab(); // First add button
      await user.keyboard('{Enter}'); // Add product

      await waitFor(() => {
        expect(screen.getByText('1 item in cart')).toBeInTheDocument();
      });

      // Continue navigation
      await user.tab(); // Review cart button
      await user.keyboard('{Enter}');

      expect(screen.getByText('RFP Cart Review')).toBeInTheDocument();
    });
  });

  describe('Multi-language Support', () => {
    it('displays form in French when locale is fr', () => {
      renderWithProviders(<RFPWorkflow />, { locale: 'fr' });

      expect(screen.getByText('Parcourir les produits')).toBeInTheDocument();
      expect(screen.getByText('Ajouter à la demande')).toBeInTheDocument();
    });

    it('submits form data with correct language context', async () => {
      const { user } = renderWithProviders(<RFPWorkflow />, { locale: 'fr' });

      // Add product
      const addButton = screen.getAllByRole('button', { name: /ajouter à la demande/i })[0];
      await user.click(addButton);

      // The product names in cart should be in French
      const reviewCartButton = screen.getByRole('button', { name: /réviser le panier/i });
      await user.click(reviewCartButton);

      expect(screen.getByText(mockProducts[0].name.fr)).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('allows users to correct form errors and resubmit', async () => {
      const { user } = renderWithProviders(<RFPWorkflow />);

      // Simulate form with errors
      const { container } = renderWithProviders(
        <RFPWorkflow initialStep="company" />
      );

      // Try to submit with invalid email
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      // Should show validation error
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();

      // Fix the error
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      // Should be able to continue
      await user.click(continueButton);
      // Should not show error anymore
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });
  });
});