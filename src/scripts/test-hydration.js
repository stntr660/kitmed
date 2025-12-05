/**
 * Hydration Testing Script
 * Tests various scenarios that could cause hydration mismatches
 */

const puppeteer = require('puppeteer');

async function testHydration() {

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();

    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.error('❌ Console Error:', msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(error.message);
      console.error('❌ Page Error:', error.message);
    });

    await page.goto('http://localhost:3000/fr', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for hydration to complete

    await page.waitForTimeout(3000);

    // Test 1: Check for hydration errors

    const hydrationErrors = errors.filter(error =>
      error.includes('hydration') ||
      error.includes('server HTML') ||
      error.includes('Text content does not match') ||
      error.includes('Expected server HTML')
    );

    if (hydrationErrors.length === 0) {

    } else {

      hydrationErrors.forEach(error => console.log('  -', error));
    }

    // Test 2: Check for dynamic content consistency

    // Refresh page and check if content is consistent
    const initialContent = await page.content();
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    const reloadedContent = await page.content();

    if (initialContent === reloadedContent) {

    } else {
      console.log('⚠️ Page content differs after reload (potential hydration issue)');
    }

    // Test 3: Check for client-side only components

    const hasHydrationBoundary = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-hydration-boundary]');
      return elements.length > 0;
    });

    // Test 4: Check banner loading

    const bannerLoaded = await page.waitForSelector('section', { timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (bannerLoaded) {

    } else {

    }

    // Test 5: Check form inputs for stable IDs

    // Navigate to a page with forms
    await page.goto('http://localhost:3000/fr/rfp/new', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    const inputIds = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[id], textarea[id]'));
      return inputs.map(input => input.id);
    });

    // Check if IDs follow our stable pattern
    const hasStableIds = inputIds.every(id =>
      id.startsWith('input-') || id.startsWith('textarea-') || id.includes('stable')
    );

    if (hasStableIds || inputIds.length === 0) {

    } else {

    }

    // Test 6: Check for any remaining Math.random() usage

    const pageSource = await page.content();
    const hasRandomValues = pageSource.includes('Math.random()') ||
                           pageSource.includes('crypto.random');

    if (!hasRandomValues) {

    } else {

    }

    // Summary

    if (hydrationErrors.length === 0 && errors.length < 3) {

    } else {

    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the tests
if (require.main === module) {
  testHydration().catch(console.error);
}

module.exports = { testHydration };