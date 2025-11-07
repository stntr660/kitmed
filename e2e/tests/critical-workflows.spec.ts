import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Critical Medical Equipment Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page and wait for it to load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Inject axe for accessibility testing
    await injectAxe(page);
  });

  test.describe('Product Discovery and Search', () => {
    test('user can search and filter medical equipment', async ({ page }) => {
      // Navigate to products page
      await page.click('[data-testid="products-nav-link"]');
      await page.waitForURL('**/products');
      
      // Verify products page loaded
      await expect(page.locator('[data-testid="products-page"]')).toBeVisible();
      
      // Search for specific equipment
      const searchInput = page.locator('[data-testid="product-search-input"]');
      await searchInput.fill('monitor');
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForLoadState('networkidle');
      
      // Verify search results
      const productCards = page.locator('[data-testid="product-card"]');
      await expect(productCards).toHaveCount.greaterThan(0);
      
      // Verify search results contain the search term
      const firstProductTitle = productCards.first().locator('[data-testid="product-title"]');
      await expect(firstProductTitle).toContainText('Monitor', { ignoreCase: true });
      
      // Apply category filter
      await page.click('[data-testid="category-filter-button"]');
      await page.click('[data-testid="category-monitors"]');
      
      // Wait for filtered results
      await page.waitForLoadState('networkidle');
      
      // Verify filtered results
      await expect(productCards).toHaveCount.greaterThan(0);
      
      // Check accessibility
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });

    test('user can view detailed product information', async ({ page }) => {
      // Navigate to products and select first product
      await page.goto('/products');
      
      const firstProduct = page.locator('[data-testid="product-card"]').first();
      const productTitle = await firstProduct.locator('[data-testid="product-title"]').textContent();
      
      await firstProduct.click();
      
      // Wait for product detail page
      await page.waitForLoadState('networkidle');
      
      // Verify product details page
      await expect(page.locator('[data-testid="product-detail-page"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText(productTitle || '');
      
      // Verify essential product information is present
      await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-specifications"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-manufacturer"]')).toBeVisible();
      
      // Verify documents section
      const documentsSection = page.locator('[data-testid="product-documents"]');
      if (await documentsSection.isVisible()) {
        const documents = documentsSection.locator('[data-testid="document-link"]');
        const documentCount = await documents.count();
        
        if (documentCount > 0) {
          // Test document download
          const firstDocument = documents.first();
          await expect(firstDocument).toHaveAttribute('href', /.+\.pdf$/);
        }
      }
      
      // Check accessibility of product detail page
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });
  });

  test.describe('RFP (Request for Proposal) Workflow', () => {
    test('user can complete full RFP submission process', async ({ page }) => {
      // Step 1: Add products to RFP cart
      await page.goto('/products');
      
      // Add first product to RFP
      const firstProduct = page.locator('[data-testid="product-card"]').first();
      await firstProduct.locator('[data-testid="add-to-rfp-button"]').click();
      
      // Verify product added to cart
      await expect(page.locator('[data-testid="rfp-cart-count"]')).toContainText('1');
      
      // Add second product
      const secondProduct = page.locator('[data-testid="product-card"]').nth(1);
      await secondProduct.locator('[data-testid="add-to-rfp-button"]').click();
      
      await expect(page.locator('[data-testid="rfp-cart-count"]')).toContainText('2');
      
      // Step 2: Review cart
      await page.click('[data-testid="view-rfp-cart-button"]');
      await page.waitForURL('**/rfp/cart');
      
      // Verify cart contents
      const cartItems = page.locator('[data-testid="cart-item"]');
      await expect(cartItems).toHaveCount(2);
      
      // Modify quantities
      const quantityInput = cartItems.first().locator('[data-testid="quantity-input"]');
      await quantityInput.fill('3');
      
      // Add notes
      const notesInput = cartItems.first().locator('[data-testid="notes-input"]');
      await notesInput.fill('Required for ICU expansion project');
      
      // Step 3: Company information
      await page.click('[data-testid="continue-to-company-info"]');
      await page.waitForURL('**/rfp/company');
      
      // Fill company details
      await page.fill('[data-testid="company-name"]', 'Metropolitan General Hospital');
      await page.selectOption('[data-testid="company-type"]', 'hospital');
      await page.fill('[data-testid="street-address"]', '123 Medical Center Drive');
      await page.fill('[data-testid="city"]', 'Healthcare City');
      await page.fill('[data-testid="postal-code"]', '12345');
      await page.selectOption('[data-testid="country"]', 'United States');
      await page.fill('[data-testid="phone"]', '+1-555-0123');
      await page.fill('[data-testid="website"]', 'https://metrohealth.com');
      
      // Step 4: Contact information
      await page.click('[data-testid="continue-to-contact"]');
      await page.waitForURL('**/rfp/contact');
      
      await page.fill('[data-testid="first-name"]', 'Dr. Sarah');
      await page.fill('[data-testid="last-name"]', 'Wilson');
      await page.fill('[data-testid="email"]', 'sarah.wilson@metrohealth.com');
      await page.fill('[data-testid="contact-phone"]', '+1-555-0124');
      await page.fill('[data-testid="position"]', 'Chief Medical Officer');
      await page.fill('[data-testid="department"]', 'Administration');
      
      // Step 5: Project details
      await page.click('[data-testid="continue-to-project"]');
      await page.waitForURL('**/rfp/project');
      
      await page.fill('[data-testid="project-description"]', 
        'Upgrading our critical care monitoring systems to improve patient outcomes and meet new accreditation standards.');
      
      await page.selectOption('[data-testid="urgency"]', 'high');
      await page.fill('[data-testid="budget-min"]', '75000');
      await page.fill('[data-testid="budget-max"]', '150000');
      await page.fill('[data-testid="delivery-requirements"]', 
        'Installation and staff training required within 45 days of order confirmation.');
      
      // Step 6: Review and submit
      await page.click('[data-testid="continue-to-review"]');
      await page.waitForURL('**/rfp/review');
      
      // Verify all information is displayed correctly
      await expect(page.locator('[data-testid="review-company-name"]')).toContainText('Metropolitan General Hospital');
      await expect(page.locator('[data-testid="review-contact-name"]')).toContainText('Dr. Sarah Wilson');
      await expect(page.locator('[data-testid="review-contact-email"]')).toContainText('sarah.wilson@metrohealth.com');
      await expect(page.locator('[data-testid="review-urgency"]')).toContainText('High');
      
      // Submit the request
      await page.click('[data-testid="submit-rfp-button"]');
      
      // Wait for confirmation page
      await page.waitForURL('**/rfp/confirmation');
      await page.waitForLoadState('networkidle');
      
      // Verify successful submission
      await expect(page.locator('[data-testid="confirmation-title"]')).toContainText('Request Submitted Successfully');
      await expect(page.locator('[data-testid="request-number"]')).toBeVisible();
      
      // Verify confirmation email notice
      await expect(page.locator('[data-testid="confirmation-message"]')).toContainText('confirmation email');
      
      // Check accessibility of all RFP pages
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });

    test('RFP form validation prevents submission with missing required fields', async ({ page }) => {
      // Add a product to cart first
      await page.goto('/products');
      await page.locator('[data-testid="product-card"]').first().locator('[data-testid="add-to-rfp-button"]').click();
      
      // Go to company info form
      await page.click('[data-testid="view-rfp-cart-button"]');
      await page.click('[data-testid="continue-to-company-info"]');
      
      // Try to continue without filling required fields
      await page.click('[data-testid="continue-to-contact"]');
      
      // Verify validation errors are shown
      await expect(page.locator('[data-testid="company-name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="street-address-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="city-error"]')).toBeVisible();
      
      // Verify form does not proceed
      await expect(page.url()).toContain('/rfp/company');
      
      // Fill required fields and verify errors disappear
      await page.fill('[data-testid="company-name"]', 'Test Hospital');
      await page.fill('[data-testid="street-address"]', '123 Test St');
      await page.fill('[data-testid="city"]', 'Test City');
      await page.fill('[data-testid="postal-code"]', '12345');
      await page.selectOption('[data-testid="country"]', 'United States');
      
      // Now form should proceed
      await page.click('[data-testid="continue-to-contact"]');
      await page.waitForURL('**/rfp/contact');
    });
  });

  test.describe('Multi-language Support', () => {
    test('application displays content in French when locale is changed', async ({ page }) => {
      // Change language to French
      await page.click('[data-testid="language-selector"]');
      await page.click('[data-testid="language-fr"]');
      
      // Wait for page to reload with French content
      await page.waitForLoadState('networkidle');
      
      // Verify French navigation
      await expect(page.locator('[data-testid="products-nav-link"]')).toContainText('Produits');
      await expect(page.locator('[data-testid="rfp-nav-link"]')).toContainText('Demande de Prix');
      
      // Navigate to products page and verify French content
      await page.click('[data-testid="products-nav-link"]');
      
      const productCard = page.locator('[data-testid="product-card"]').first();
      await expect(productCard.locator('[data-testid="add-to-rfp-button"]')).toContainText('Ajouter à la demande');
      
      // Verify accessibility in French
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('critical workflows work on mobile devices', async ({ page, isMobile }) => {
      if (!isMobile) {
        // Set mobile viewport for desktop browser
        await page.setViewportSize({ width: 375, height: 667 });
      }
      
      // Test mobile navigation
      await page.goto('/');
      
      // Open mobile menu
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Navigate to products via mobile menu
      await page.click('[data-testid="mobile-products-link"]');
      await page.waitForURL('**/products');
      
      // Verify mobile product grid layout
      const productGrid = page.locator('[data-testid="products-grid"]');
      await expect(productGrid).toBeVisible();
      
      // Test mobile product card interactions
      const productCard = page.locator('[data-testid="product-card"]').first();
      await productCard.click();
      
      // Verify mobile product detail view
      await expect(page.locator('[data-testid="mobile-product-detail"]')).toBeVisible();
      
      // Test mobile RFP flow
      await page.click('[data-testid="mobile-add-to-rfp"]');
      await expect(page.locator('[data-testid="mobile-cart-indicator"]')).toContainText('1');
      
      // Check mobile accessibility
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });
  });

  test.describe('Performance and Core Web Vitals', () => {
    test('pages load within acceptable performance thresholds', async ({ page }) => {
      // Test home page performance
      const homePageStart = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const homePageTime = Date.now() - homePageStart;
      
      // Home page should load quickly
      expect(homePageTime).toBeLessThan(3000);
      
      // Test products page performance
      const productsPageStart = Date.now();
      await page.goto('/products');
      await page.waitForLoadState('networkidle');
      const productsPageTime = Date.now() - productsPageStart;
      
      // Products page should load within reasonable time
      expect(productsPageTime).toBeLessThan(5000);
      
      // Verify no console errors
      const logs: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(msg.text());
        }
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // No JavaScript errors should occur
      expect(logs.filter(log => !log.includes('favicon'))).toHaveLength(0);
    });

    test('images load efficiently with proper lazy loading', async ({ page }) => {
      await page.goto('/products');
      
      // Monitor network requests for images
      const imageRequests: string[] = [];
      page.on('request', request => {
        if (request.url().match(/\.(jpg|jpeg|png|webp|svg)$/)) {
          imageRequests.push(request.url());
        }
      });
      
      // Scroll to load more images
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await page.waitForTimeout(1000);
      
      // Verify lazy loading is working (images load as needed)
      expect(imageRequests.length).toBeGreaterThan(0);
      expect(imageRequests.length).toBeLessThan(50); // Shouldn't load all images at once
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('application handles network errors gracefully', async ({ page }) => {
      await page.goto('/products');
      
      // Simulate network failure
      await page.route('**/api/products', route => {
        route.abort('failed');
      });
      
      // Try to search (which would trigger API call)
      await page.fill('[data-testid="product-search-input"]', 'monitor');
      await page.press('[data-testid="product-search-input"]', 'Enter');
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // Remove network failure and retry
      await page.unroute('**/api/products');
      await page.click('[data-testid="retry-button"]');
      
      // Verify recovery
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="product-card"]')).toHaveCount.greaterThan(0);
    });

    test('form data persists across page refreshes', async ({ page }) => {
      // Start RFP process
      await page.goto('/products');
      await page.locator('[data-testid="product-card"]').first().locator('[data-testid="add-to-rfp-button"]').click();
      await page.click('[data-testid="view-rfp-cart-button"]');
      await page.click('[data-testid="continue-to-company-info"]');
      
      // Fill some form data
      await page.fill('[data-testid="company-name"]', 'Test Hospital');
      await page.fill('[data-testid="street-address"]', '123 Test Street');
      
      // Refresh the page
      await page.reload();
      
      // Verify form data persisted
      await expect(page.locator('[data-testid="company-name"]')).toHaveValue('Test Hospital');
      await expect(page.locator('[data-testid="street-address"]')).toHaveValue('123 Test Street');
    });
  });
});