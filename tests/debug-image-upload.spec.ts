import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Debug Image Upload', () => {
  test('should upload image when creating product', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[MediaUpload]') || text.includes('[ProductDrawer]') || text.includes('tempFiles')) {
        console.log('BROWSER:', text);
      }
    });

    // Create screenshots folder
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Login
    console.log('Going to login page...');
    await page.goto('https://kitmed-staging.zonemation.cloud/en/admin/login');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png') });

    await page.fill('input[type="email"]', 'admin@kitmed.ma');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(screenshotsDir, '02-after-login.png') });
    console.log('Current URL:', page.url());

    // Navigate to products
    await page.goto('https://kitmed-staging.zonemation.cloud/en/admin/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(screenshotsDir, '03-products-page.png') });
    console.log('On products page');

    // Find all buttons on the page
    const buttons = await page.locator('button').all();
    console.log('Found', buttons.length, 'buttons');
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}:`, text?.trim().substring(0, 50));
    }

    // Try different selectors for Add button
    const addButtonSelectors = [
      'button:has-text("Add Product")',
      'button:has-text("Add")',
      'button:has-text("Ajouter")',
      'button:has-text("Nouveau")',
      'button:has-text("New")',
      '[data-testid="add-product"]',
      'a:has-text("Add")',
      'a:has-text("Ajouter")',
    ];

    let addButton = null;
    for (const selector of addButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        addButton = btn;
        console.log('Found add button with selector:', selector);
        break;
      }
    }

    if (!addButton) {
      // Look for any button in header area
      const headerButtons = page.locator('header button, [class*="header"] button, .flex button').first();
      if (await headerButtons.isVisible({ timeout: 1000 }).catch(() => false)) {
        addButton = headerButtons;
        console.log('Found header button');
      }
    }

    if (!addButton) {
      console.log('Could not find Add button');
      await page.screenshot({ path: path.join(screenshotsDir, 'error-no-add-button.png'), fullPage: true });
      return;
    }

    await addButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(screenshotsDir, '04-drawer-opened.png') });
    console.log('Clicked Add button');

    // Create a simple test PNG (1x1 red pixel)
    const testImagePath = path.join(screenshotsDir, 'test-image.png');
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64,
      0x08, 0x02, 0x00, 0x00, 0x00, 0xFF, 0x80, 0x02, 0x03, 0x00, 0x00, 0x00,
      0x19, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0xED, 0xC1, 0x01, 0x0D, 0x00,
      0x00, 0x00, 0xC2, 0xA0, 0xF7, 0x4F, 0x6D, 0x0E, 0x37, 0xA0, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xBE, 0x0D, 0x21, 0x00, 0x00, 0x01,
      0x9A, 0x60, 0xE1, 0xD5, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
      0xAE, 0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(testImagePath, pngBuffer);
    console.log('Created test image at:', testImagePath);

    // Find file input
    const fileInput = page.locator('input[type="file"]').first();
    const inputCount = await fileInput.count();
    console.log('File input count:', inputCount);

    if (inputCount > 0) {
      await fileInput.setInputFiles(testImagePath);
      console.log('Uploaded via file input');
      await page.waitForTimeout(2000);
    } else {
      console.log('No file input found');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '05-after-image-upload.png') });

    // Fill form fields
    // Product name
    const nameInput = page.locator('#nom-fr').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('Test Product ' + Date.now());
      console.log('Filled product name');
    } else {
      console.log('Name input not found');
    }

    // Reference
    const refInput = page.locator('#reference-fournisseur').first();
    if (await refInput.isVisible().catch(() => false)) {
      await refInput.fill('REF-TEST-' + Date.now());
      console.log('Filled reference');
    }

    // Brand/Constructor
    const brandSelect = page.locator('#constructeur').first();
    if (await brandSelect.isVisible().catch(() => false)) {
      const tagName = await brandSelect.evaluate(el => el.tagName.toLowerCase());
      console.log('Brand element type:', tagName);
      if (tagName === 'select') {
        const options = await brandSelect.locator('option').count();
        console.log('Brand options count:', options);
        if (options > 1) {
          await brandSelect.selectOption({ index: 1 });
          console.log('Selected brand');
        }
      } else {
        await brandSelect.fill('Test Brand');
      }
    }

    // Category
    const categorySelect = page.locator('#categoryId').first();
    if (await categorySelect.isVisible().catch(() => false)) {
      const options = await categorySelect.locator('option').count();
      console.log('Category options count:', options);
      if (options > 1) {
        await categorySelect.selectOption({ index: 1 });
        console.log('Selected category');
      }
    }

    await page.screenshot({ path: path.join(screenshotsDir, '06-form-filled.png') });

    // Get form values
    const formValues = await page.evaluate(() => {
      const form: Record<string, string> = {};
      document.querySelectorAll('input, select, textarea').forEach((el: any) => {
        if (el.id) {
          form[el.id] = el.value;
        }
      });
      return form;
    });
    console.log('Form values:', JSON.stringify(formValues, null, 2));

    // Check save button
    const allButtons = await page.locator('button').all();
    let saveButton = null;
    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text?.toLowerCase().includes('add') || text?.toLowerCase().includes('save') || text?.toLowerCase().includes('ajouter') || text?.toLowerCase().includes('enregistrer')) {
        const disabled = await btn.isDisabled();
        console.log('Found potential save button:', text?.trim(), 'disabled:', disabled);
        if (!saveButton) saveButton = btn;
      }
    }

    if (saveButton) {
      const isDisabled = await saveButton.isDisabled();
      console.log('Save button disabled:', isDisabled);

      if (!isDisabled) {
        // Listen for API calls
        page.on('request', req => {
          if (req.url().includes('/api/')) {
            console.log('API Request:', req.method(), req.url());
          }
        });
        page.on('response', async res => {
          if (res.url().includes('/api/')) {
            console.log('API Response:', res.status(), res.url());
            if (res.status() !== 200) {
              try {
                const body = await res.json();
                console.log('Response body:', JSON.stringify(body));
              } catch (e) {}
            }
          }
        });

        await saveButton.click();
        console.log('Clicked save');
        await page.waitForTimeout(5000);
      }
    }

    await page.screenshot({ path: path.join(screenshotsDir, '07-after-save.png') });

    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });
});
