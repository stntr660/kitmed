import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  // Create a browser instance for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Verify critical pages are accessible
    console.log('✅ Verifying critical pages...');
    
    // Check home page
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 30000 });
    
    // Check products page
    await page.goto('http://localhost:3000/products');
    await page.waitForSelector('[data-testid="products-page"]', { timeout: 30000 });
    
    // Check admin login page
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForSelector('[data-testid="admin-login-form"]', { timeout: 30000 });

    // Setup admin authentication state
    console.log('🔐 Setting up admin authentication...');
    await page.fill('[data-testid="email-input"]', 'admin@kitmed.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login
    await page.waitForURL('**/admin/dashboard', { timeout: 30000 });
    
    // Save admin auth state
    await context.storageState({ path: './e2e/fixtures/admin-auth.json' });
    
    console.log('✅ Admin authentication state saved');

    // Setup test data if needed
    console.log('📊 Setting up test data...');
    
    // You could add test data setup here
    // For example, ensuring specific test products exist
    
    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;