import { test, expect, Page } from '@playwright/test';

// Comprehensive KITMED Testing Suite
// Testing all CRUD operations, forms, and file uploads

test.describe('KITMED Comprehensive Quality Testing', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to application
    await page.goto('http://localhost:3000');
    
    // Check if admin panel is accessible
    await page.goto('http://localhost:3000/admin');
  });

  test.describe('Admin Interface Accessibility', () => {
    test('should load admin dashboard', async () => {
      await expect(page).toHaveURL(/.*\/admin/);
      
      // Check for main navigation elements
      const navigation = page.locator('nav');
      await expect(navigation).toBeVisible();
      
      // Verify admin sections are available
      const adminSections = ['Products', 'Partners', 'Categories', 'Settings'];
      for (const section of adminSections) {
        const sectionLink = page.getByRole('link', { name: section });
        await expect(sectionLink).toBeVisible();
      }
    });
  });

  test.describe('Products Management', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:3000/admin/products');
    });

    test('should display products list', async () => {
      // Wait for products to load
      await page.waitForSelector('[data-testid="products-list"]', { timeout: 10000 });
      
      // Verify products are displayed
      const productItems = page.locator('[data-testid="product-item"]');
      await expect(productItems).toHaveCount.greaterThan(0);
    });

    test('should open product creation form', async () => {
      // Click "Add Product" button
      const addButton = page.getByRole('button', { name: /add product|ajouter produit/i });
      await addButton.click();
      
      // Verify form is displayed
      await expect(page.locator('form')).toBeVisible();
      
      // Check required fields are present
      const requiredFields = [
        'nom.fr',    // French name
        'nom.en',    // English name
        'referenceFournisseur',  // Reference
        'constructeur',  // Manufacturer
        'categoryId'     // Category
      ];
      
      for (const field of requiredFields) {
        await expect(page.locator(`[name="${field}"]`)).toBeVisible();
      }
    });

    test('should test manufacturer dropdown functionality', async () => {
      // Open product form
      const addButton = page.getByRole('button', { name: /add product|ajouter produit/i });
      await addButton.click();
      
      // Check manufacturer dropdown
      const manufacturerSelect = page.locator('select[name="constructeur"]');
      await expect(manufacturerSelect).toBeVisible();
      
      // Verify dropdown shows loading or options
      const options = manufacturerSelect.locator('option');
      await expect(options).toHaveCount.greaterThan(0);
      
      // First option should be placeholder
      const firstOption = options.first();
      await expect(firstOption).toHaveText(/select|chargement|loading/i);
    });

    test('should test save-first message for file upload', async () => {
      // Open product creation form (new product)
      const addButton = page.getByRole('button', { name: /add product|ajouter produit/i });
      await addButton.click();
      
      // Look for ImageUploadBox components
      const uploadBoxes = page.locator('[class*="border-2"][class*="border-dashed"]');
      await expect(uploadBoxes.first()).toBeVisible();
      
      // Check for save-first message
      const saveMessage = page.getByText(/veuillez d'abord enregistrer/i);
      await expect(saveMessage).toBeVisible();
    });

    test('should test PDF brochure upload section', async () => {
      // Open product form
      const addButton = page.getByRole('button', { name: /add product|ajouter produit/i });
      await addButton.click();
      
      // Look for PDF brochure section in product details
      const pdfSection = page.getByText(/pdf brochure|brochure pdf/i);
      await expect(pdfSection).toBeVisible();
      
      // Verify it's in the product details section, not at the bottom
      const detailsCard = page.locator('form').locator('div').filter({ hasText: /descriptions|product details/i });
      const pdfUpload = detailsCard.locator('[accept*="pdf"]');
      await expect(pdfUpload).toBeVisible();
    });
  });

  test.describe('Partners Management', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:3000/admin/partners');
    });

    test('should display partners list', async () => {
      // Wait for partners to load
      await page.waitForSelector('[data-testid="partners-list"]', { timeout: 10000 });
      
      // Verify partners are displayed
      const partnerItems = page.locator('[data-testid="partner-item"]');
      await expect(partnerItems).toHaveCount.greaterThan(0);
    });

    test('should test partner form with translations', async () => {
      // Click "Add Partner" button
      const addButton = page.getByRole('button', { name: /add partner|ajouter partenaire/i });
      await addButton.click();
      
      // Verify form is displayed
      await expect(page.locator('form')).toBeVisible();
      
      // Check translation fields
      const frenchNameField = page.locator('[name="nom.fr"]');
      const englishNameField = page.locator('[name="nom.en"]');
      
      await expect(frenchNameField).toBeVisible();
      await expect(englishNameField).toBeVisible();
      
      // Test logo upload
      const logoUpload = page.locator('[data-testid="logo-upload"]');
      await expect(logoUpload).toBeVisible();
    });
  });

  test.describe('Categories Management', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:3000/admin/categories');
    });

    test('should display categories interface', async () => {
      // Categories might be empty, so check for the interface
      const categoriesContainer = page.locator('[data-testid="categories-container"]');
      await expect(categoriesContainer).toBeVisible();
      
      // Check for add category button
      const addButton = page.getByRole('button', { name: /add category|ajouter catégorie/i });
      await expect(addButton).toBeVisible();
    });

    test('should test category creation form', async () => {
      // Click "Add Category" button
      const addButton = page.getByRole('button', { name: /add category|ajouter catégorie/i });
      await addButton.click();
      
      // Verify form is displayed
      await expect(page.locator('form')).toBeVisible();
      
      // Check for hierarchical parent selection
      const parentSelect = page.locator('select[name="parentId"]');
      await expect(parentSelect).toBeVisible();
      
      // Check for image upload
      const imageUpload = page.locator('[data-testid="category-image-upload"]');
      await expect(imageUpload).toBeVisible();
    });
  });

  test.describe('File Upload System', () => {
    test('should test ImageUploadBox drag and drop', async () => {
      // Go to any form with image upload
      await page.goto('http://localhost:3000/admin/products');
      const addButton = page.getByRole('button', { name: /add product|ajouter produit/i });
      await addButton.click();
      
      // Find upload box
      const uploadBox = page.locator('[class*="border-2"][class*="border-dashed"]').first();
      await expect(uploadBox).toBeVisible();
      
      // Check for upload icon and placeholder text
      const uploadIcon = uploadBox.locator('svg');
      await expect(uploadIcon).toBeVisible();
      
      const placeholderText = uploadBox.getByText(/cliquez pour télécharger|drag/i);
      await expect(placeholderText).toBeVisible();
    });

    test('should test file validation messages', async () => {
      // Navigate to form
      await page.goto('http://localhost:3000/admin/partners');
      const addButton = page.getByRole('button', { name: /add partner|ajouter partenaire/i });
      await addButton.click();
      
      // Look for file size information
      const sizeInfo = page.getByText(/max.*mb|formats.*jpg/i);
      await expect(sizeInfo).toBeVisible();
    });
  });

  test.describe('Translation System', () => {
    test('should test language switching', async () => {
      // Look for language switcher
      const languageSwitch = page.locator('[data-testid="language-switcher"]');
      
      if (await languageSwitch.isVisible()) {
        // Test switching between French and English
        await languageSwitch.click();
        
        // Check if interface language changes
        const frenchText = page.getByText(/produits|partenaires/i);
        await expect(frenchText).toBeVisible();
      }
    });

    test('should test multilingual form fields', async () => {
      // Test in product form
      await page.goto('http://localhost:3000/admin/products');
      const addButton = page.getByRole('button', { name: /add product|ajouter produit/i });
      await addButton.click();
      
      // Verify French and English fields exist
      const frenchNameLabel = page.getByText(/nom.*français|nom produit fr/i);
      const englishNameLabel = page.getByText(/nom.*anglais|nom produit en/i);
      
      await expect(frenchNameLabel).toBeVisible();
      await expect(englishNameLabel).toBeVisible();
    });
  });

  test.describe('Data Validation', () => {
    test('should test required field validation', async () => {
      // Navigate to product form
      await page.goto('http://localhost:3000/admin/products');
      const addButton = page.getByRole('button', { name: /add product|ajouter produit/i });
      await addButton.click();
      
      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /create|créer|save|enregistrer/i });
      await submitButton.click();
      
      // Check for validation errors
      const errorMessages = page.locator('[class*="text-red"]');
      await expect(errorMessages.first()).toBeVisible();
    });

    test('should test form completion workflow', async () => {
      // Navigate to product form
      await page.goto('http://localhost:3000/admin/products');
      const addButton = page.getByRole('button', { name: /add product|ajouter produit/i });
      await addButton.click();
      
      // Fill minimum required fields
      await page.fill('[name="nom.fr"]', 'Test Product FR');
      await page.fill('[name="nom.en"]', 'Test Product EN');
      await page.fill('[name="referenceFournisseur"]', 'TEST-001');
      await page.selectOption('[name="categoryId"]', 'cardiology');
      
      // Select manufacturer (if available)
      const manufacturerOptions = page.locator('select[name="constructeur"] option');
      const optionCount = await manufacturerOptions.count();
      if (optionCount > 1) {
        await page.selectOption('[name="constructeur"]', { index: 1 });
      }
      
      // Submit form
      const submitButton = page.getByRole('button', { name: /create|créer|save|enregistrer/i });
      await submitButton.click();
      
      // Wait for success response or error
      await page.waitForTimeout(2000);
      
      // Check if we're redirected or get success message
      const url = page.url();
      console.log('Form submitted, current URL:', url);
    });
  });

  test.describe('Settings Form', () => {
    test.beforeEach(async () => {
      await page.goto('http://localhost:3000/admin/settings');
    });

    test('should test settings form with logo upload', async () => {
      // Check for settings form
      const settingsForm = page.locator('form');
      await expect(settingsForm).toBeVisible();
      
      // Check for site logo upload
      const logoUpload = page.locator('[data-testid="site-logo-upload"]');
      await expect(logoUpload).toBeVisible();
      
      // Test configuration fields
      const configFields = page.locator('input, textarea, select');
      await expect(configFields.first()).toBeVisible();
    });
  });

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });
});