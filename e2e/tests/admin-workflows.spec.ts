import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Admin Portal Workflows', () => {
  // Use admin authentication state
  test.use({ storageState: './e2e/fixtures/admin-auth.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await injectAxe(page);
  });

  test.describe('Dashboard Overview', () => {
    test('admin dashboard displays key metrics and navigation', async ({ page }) => {
      // Verify dashboard loads
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      
      // Check key metrics cards
      await expect(page.locator('[data-testid="total-products-metric"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-rfp-requests-metric"]')).toBeVisible();
      await expect(page.locator('[data-testid="pending-rfps-metric"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-categories-metric"]')).toBeVisible();
      
      // Verify navigation menu
      await expect(page.locator('[data-testid="admin-nav-products"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-nav-categories"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-nav-rfp-requests"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-nav-users"]')).toBeVisible();
      
      // Check accessibility
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });

    test('dashboard metrics update in real-time', async ({ page }) => {
      // Get initial product count
      const initialProductCount = await page.locator('[data-testid="total-products-metric"] .metric-value').textContent();
      
      // Navigate to products and add a new product
      await page.click('[data-testid="admin-nav-products"]');
      await page.click('[data-testid="add-product-button"]');
      
      // Fill product form
      await page.fill('[data-testid="product-name-en"]', 'Test Product ' + Date.now());
      await page.fill('[data-testid="product-name-fr"]', 'Produit Test ' + Date.now());
      await page.fill('[data-testid="product-description-en"]', 'Test description');
      await page.fill('[data-testid="product-description-fr"]', 'Description test');
      await page.fill('[data-testid="product-sku"]', 'TEST-' + Date.now());
      await page.selectOption('[data-testid="product-category"]', { index: 1 });
      await page.selectOption('[data-testid="product-manufacturer"]', { index: 1 });
      await page.selectOption('[data-testid="product-discipline"]', { index: 1 });
      
      // Save product
      await page.click('[data-testid="save-product-button"]');
      await page.waitForURL('**/admin/products');
      
      // Return to dashboard
      await page.click('[data-testid="admin-nav-dashboard"]');
      
      // Verify product count increased
      const newProductCount = await page.locator('[data-testid="total-products-metric"] .metric-value').textContent();
      expect(parseInt(newProductCount || '0')).toBeGreaterThan(parseInt(initialProductCount || '0'));
    });
  });

  test.describe('Product Management', () => {
    test('admin can create, edit, and manage products', async ({ page }) => {
      await page.goto('/admin/products');
      
      // Verify products list
      await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
      
      // Create new product
      await page.click('[data-testid="add-product-button"]');
      
      const productName = 'E2E Test Product ' + Date.now();
      const productSKU = 'E2E-' + Date.now();
      
      // Fill required fields
      await page.fill('[data-testid="product-name-en"]', productName);
      await page.fill('[data-testid="product-name-fr"]', 'Produit Test E2E ' + Date.now());
      await page.fill('[data-testid="product-description-en"]', 'Comprehensive test product for E2E testing');
      await page.fill('[data-testid="product-description-fr"]', 'Produit de test complet pour les tests E2E');
      await page.fill('[data-testid="product-sku"]', productSKU);
      
      // Select category, manufacturer, and discipline
      await page.selectOption('[data-testid="product-category"]', { index: 1 });
      await page.selectOption('[data-testid="product-manufacturer"]', { index: 1 });
      await page.selectOption('[data-testid="product-discipline"]', { index: 1 });
      
      // Add specifications
      await page.click('[data-testid="add-specification-button"]');
      await page.fill('[data-testid="spec-name-en-0"]', 'Test Specification');
      await page.fill('[data-testid="spec-name-fr-0"]', 'Spécification Test');
      await page.fill('[data-testid="spec-value-en-0"]', 'Test Value');
      await page.fill('[data-testid="spec-value-fr-0"]', 'Valeur Test');
      await page.fill('[data-testid="spec-unit-0"]', 'units');
      
      // Save product
      await page.click('[data-testid="save-product-button"]');
      
      // Verify redirect to products list
      await page.waitForURL('**/admin/products');
      
      // Verify product appears in list
      await expect(page.locator(`text=${productName}`)).toBeVisible();
      
      // Edit the product
      const productRow = page.locator(`tr:has-text("${productSKU}")`);
      await productRow.locator('[data-testid="edit-product-button"]').click();
      
      // Modify product
      const updatedDescription = 'Updated description for E2E testing';
      await page.fill('[data-testid="product-description-en"]', updatedDescription);
      
      // Save changes
      await page.click('[data-testid="save-product-button"]');
      await page.waitForURL('**/admin/products');
      
      // Verify changes
      await productRow.locator('[data-testid="view-product-button"]').click();
      await expect(page.locator('[data-testid="product-description"]')).toContainText(updatedDescription);
      
      // Check accessibility
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });

    test('admin can upload and manage product images', async ({ page }) => {
      await page.goto('/admin/products');
      
      // Create or edit a product
      await page.click('[data-testid="add-product-button"]');
      
      // Fill basic product info
      await page.fill('[data-testid="product-name-en"]', 'Image Test Product');
      await page.fill('[data-testid="product-name-fr"]', 'Produit Test Image');
      await page.fill('[data-testid="product-description-en"]', 'Product for testing image upload');
      await page.fill('[data-testid="product-description-fr"]', 'Produit pour tester le téléchargement d\'images');
      await page.fill('[data-testid="product-sku"]', 'IMG-TEST-' + Date.now());
      await page.selectOption('[data-testid="product-category"]', { index: 1 });
      await page.selectOption('[data-testid="product-manufacturer"]', { index: 1 });
      await page.selectOption('[data-testid="product-discipline"]', { index: 1 });
      
      // Test image upload
      const fileInput = page.locator('[data-testid="image-upload-input"]');
      
      // Create a test image file (small PNG)
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      
      // Upload image
      await fileInput.setInputFiles({
        name: 'test-image.png',
        mimeType: 'image/png',
        buffer: testImageBuffer,
      });
      
      // Wait for upload to complete
      await expect(page.locator('[data-testid="uploaded-image-preview"]')).toBeVisible();
      
      // Verify image alt text fields
      await page.fill('[data-testid="image-alt-en-0"]', 'Test medical equipment image');
      await page.fill('[data-testid="image-alt-fr-0"]', 'Image d\'équipement médical test');
      
      // Save product with image
      await page.click('[data-testid="save-product-button"]');
      await page.waitForURL('**/admin/products');
      
      // Verify image appears in product list
      const productRow = page.locator('tr:has-text("IMG-TEST-")');
      await expect(productRow.locator('[data-testid="product-image-thumbnail"]')).toBeVisible();
    });

    test('admin can bulk import products via CSV', async ({ page }) => {
      await page.goto('/admin/products');
      
      // Click CSV import button
      await page.click('[data-testid="csv-import-button"]');
      
      // Verify import modal opens
      await expect(page.locator('[data-testid="csv-import-modal"]')).toBeVisible();
      
      // Download template
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-template-button"]');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('product-import-template.csv');
      
      // Create test CSV content
      const csvContent = `name_en,name_fr,description_en,description_fr,sku,category,manufacturer,discipline,status
Test Product 1,Produit Test 1,Description 1,Description 1,CSV-001,Monitors,Philips Healthcare,Cardiology,active
Test Product 2,Produit Test 2,Description 2,Description 2,CSV-002,Defibrillators,Medtronic,Cardiology,active`;
      
      // Upload CSV file
      await page.locator('[data-testid="csv-file-input"]').setInputFiles({
        name: 'test-products.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent),
      });
      
      // Preview import
      await page.click('[data-testid="preview-import-button"]');
      
      // Verify preview shows correct data
      await expect(page.locator('[data-testid="import-preview-table"]')).toBeVisible();
      await expect(page.locator('text=Test Product 1')).toBeVisible();
      await expect(page.locator('text=Test Product 2')).toBeVisible();
      
      // Execute import
      await page.click('[data-testid="execute-import-button"]');
      
      // Wait for import completion
      await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
      
      // Close modal and verify products in list
      await page.click('[data-testid="close-import-modal"]');
      await expect(page.locator('text=CSV-001')).toBeVisible();
      await expect(page.locator('text=CSV-002')).toBeVisible();
    });
  });

  test.describe('RFP Request Management', () => {
    test('admin can view and respond to RFP requests', async ({ page }) => {
      await page.goto('/admin/rfp-requests');
      
      // Verify RFP requests list
      await expect(page.locator('[data-testid="rfp-requests-table"]')).toBeVisible();
      
      // Filter by status
      await page.selectOption('[data-testid="status-filter"]', 'submitted');
      await page.waitForLoadState('networkidle');
      
      // View first RFP request
      const firstRequest = page.locator('[data-testid="rfp-request-row"]').first();
      await firstRequest.locator('[data-testid="view-rfp-button"]').click();
      
      // Verify RFP details page
      await expect(page.locator('[data-testid="rfp-detail-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="company-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="contact-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="requested-items"]')).toBeVisible();
      
      // Add response
      await page.click('[data-testid="add-response-button"]');
      
      await page.fill('[data-testid="response-message"]', 
        'Thank you for your request. We have reviewed your requirements and will provide a detailed quote within 24 hours.');
      
      // Upload response document
      const responseDoc = Buffer.from('Mock PDF content');
      await page.locator('[data-testid="response-document-input"]').setInputFiles({
        name: 'quote-response.pdf',
        mimeType: 'application/pdf',
        buffer: responseDoc,
      });
      
      // Set validity period
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      await page.fill('[data-testid="valid-until"]', futureDate.toISOString().split('T')[0]);
      
      // Send response
      await page.click('[data-testid="send-response-button"]');
      
      // Verify response sent
      await expect(page.locator('[data-testid="response-sent-confirmation"]')).toBeVisible();
      
      // Verify status updated
      await expect(page.locator('[data-testid="rfp-status"]')).toContainText('Responded');
      
      // Check accessibility
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });

    test('admin can export RFP data for reporting', async ({ page }) => {
      await page.goto('/admin/rfp-requests');
      
      // Set date range filter
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      await page.fill('[data-testid="date-from"]', startDate.toISOString().split('T')[0]);
      await page.fill('[data-testid="date-to"]', new Date().toISOString().split('T')[0]);
      
      // Apply filters
      await page.click('[data-testid="apply-filters-button"]');
      await page.waitForLoadState('networkidle');
      
      // Export to CSV
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv-button"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/rfp-requests-\d{4}-\d{2}-\d{2}\.csv/);
      
      // Export to Excel
      const excelDownloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-excel-button"]');
      const excelDownload = await excelDownloadPromise;
      
      expect(excelDownload.suggestedFilename()).toMatch(/rfp-requests-\d{4}-\d{2}-\d{2}\.xlsx/);
    });
  });

  test.describe('Category and Manufacturer Management', () => {
    test('admin can manage product categories', async ({ page }) => {
      await page.goto('/admin/categories');
      
      // Create new category
      await page.click('[data-testid="add-category-button"]');
      
      const categoryName = 'E2E Test Category ' + Date.now();
      
      await page.fill('[data-testid="category-name-en"]', categoryName);
      await page.fill('[data-testid="category-name-fr"]', 'Catégorie Test E2E ' + Date.now());
      await page.fill('[data-testid="category-description-en"]', 'Test category for E2E testing');
      await page.fill('[data-testid="category-description-fr"]', 'Catégorie test pour les tests E2E');
      
      // Save category
      await page.click('[data-testid="save-category-button"]');
      
      // Verify category in list
      await expect(page.locator(`text=${categoryName}`)).toBeVisible();
      
      // Edit category
      const categoryRow = page.locator(`tr:has-text("${categoryName}")`);
      await categoryRow.locator('[data-testid="edit-category-button"]').click();
      
      // Update description
      await page.fill('[data-testid="category-description-en"]', 'Updated test category description');
      await page.click('[data-testid="save-category-button"]');
      
      // Verify update
      await categoryRow.locator('[data-testid="view-category-button"]').click();
      await expect(page.locator('[data-testid="category-description"]')).toContainText('Updated test category description');
    });

    test('admin can manage manufacturers', async ({ page }) => {
      await page.goto('/admin/manufacturers');
      
      // Create new manufacturer
      await page.click('[data-testid="add-manufacturer-button"]');
      
      const manufacturerName = 'E2E Test Manufacturer ' + Date.now();
      
      await page.fill('[data-testid="manufacturer-name"]', manufacturerName);
      await page.fill('[data-testid="manufacturer-description-en"]', 'Test manufacturer for E2E testing');
      await page.fill('[data-testid="manufacturer-description-fr"]', 'Fabricant test pour les tests E2E');
      await page.fill('[data-testid="manufacturer-website"]', 'https://www.test-manufacturer.com');
      await page.selectOption('[data-testid="manufacturer-country"]', 'United States');
      
      // Upload logo
      const logoBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      await page.locator('[data-testid="manufacturer-logo-input"]').setInputFiles({
        name: 'test-logo.png',
        mimeType: 'image/png',
        buffer: logoBuffer,
      });
      
      // Save manufacturer
      await page.click('[data-testid="save-manufacturer-button"]');
      
      // Verify manufacturer in list
      await expect(page.locator(`text=${manufacturerName}`)).toBeVisible();
    });
  });

  test.describe('User Management', () => {
    test('admin can manage user accounts', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Create new user
      await page.click('[data-testid="add-user-button"]');
      
      const userEmail = `test-user-${Date.now()}@kitmed.com`;
      
      await page.fill('[data-testid="user-email"]', userEmail);
      await page.fill('[data-testid="user-first-name"]', 'Test');
      await page.fill('[data-testid="user-last-name"]', 'User');
      await page.selectOption('[data-testid="user-role"]', 'editor');
      await page.fill('[data-testid="user-password"]', 'TempPassword123!');
      await page.fill('[data-testid="user-password-confirm"]', 'TempPassword123!');
      
      // Save user
      await page.click('[data-testid="save-user-button"]');
      
      // Verify user in list
      await expect(page.locator(`text=${userEmail}`)).toBeVisible();
      
      // Edit user role
      const userRow = page.locator(`tr:has-text("${userEmail}")`);
      await userRow.locator('[data-testid="edit-user-button"]').click();
      
      await page.selectOption('[data-testid="user-role"]', 'viewer');
      await page.click('[data-testid="save-user-button"]');
      
      // Verify role updated
      await expect(userRow.locator('[data-testid="user-role-display"]')).toContainText('Viewer');
      
      // Deactivate user
      await userRow.locator('[data-testid="deactivate-user-button"]').click();
      await page.click('[data-testid="confirm-deactivate-button"]');
      
      // Verify user deactivated
      await expect(userRow.locator('[data-testid="user-status"]')).toContainText('Inactive');
    });
  });

  test.describe('Security and Permissions', () => {
    test('admin operations require proper authentication', async ({ page }) => {
      // Try to access admin pages without authentication
      await page.context().clearCookies();
      await page.goto('/admin/dashboard');
      
      // Should redirect to login
      await page.waitForURL('**/admin/login');
      await expect(page.locator('[data-testid="admin-login-form"]')).toBeVisible();
    });

    test('different user roles have appropriate access levels', async ({ page }) => {
      // This test would need to be run with different user contexts
      // For now, verify that admin has full access
      
      // Check all admin navigation items are visible
      await expect(page.locator('[data-testid="admin-nav-products"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-nav-categories"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-nav-manufacturers"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-nav-rfp-requests"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-nav-users"]')).toBeVisible();
      
      // Verify admin can access sensitive operations
      await page.goto('/admin/users');
      await expect(page.locator('[data-testid="add-user-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="bulk-operations"]')).toBeVisible();
    });
  });

  test.describe('Data Validation and Error Handling', () => {
    test('admin forms validate input data properly', async ({ page }) => {
      await page.goto('/admin/products');
      await page.click('[data-testid="add-product-button"]');
      
      // Try to save without required fields
      await page.click('[data-testid="save-product-button"]');
      
      // Verify validation errors
      await expect(page.locator('[data-testid="name-en-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="name-fr-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="description-en-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="sku-error"]')).toBeVisible();
      
      // Test duplicate SKU validation
      await page.fill('[data-testid="product-name-en"]', 'Test Product');
      await page.fill('[data-testid="product-name-fr"]', 'Produit Test');
      await page.fill('[data-testid="product-description-en"]', 'Test description');
      await page.fill('[data-testid="product-description-fr"]', 'Description test');
      await page.fill('[data-testid="product-sku"]', 'EXISTING-SKU'); // Assuming this exists
      
      await page.click('[data-testid="save-product-button"]');
      
      // Should show duplicate SKU error
      await expect(page.locator('[data-testid="sku-duplicate-error"]')).toBeVisible();
    });

    test('admin panel handles server errors gracefully', async ({ page }) => {
      // Intercept API calls and return errors
      await page.route('**/api/admin/products', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Internal server error' },
          }),
        });
      });
      
      await page.goto('/admin/products');
      
      // Should show error message
      await expect(page.locator('[data-testid="server-error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // Test retry functionality
      await page.unroute('**/api/admin/products');
      await page.click('[data-testid="retry-button"]');
      
      // Should recover and show products
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
    });
  });
});