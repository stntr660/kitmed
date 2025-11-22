/**
 * Hydration Testing Script
 * Tests various scenarios that could cause hydration mismatches
 */

const puppeteer = require('puppeteer');

async function testHydration() {
  console.log('🚀 Starting hydration tests...');
  
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
    
    console.log('🌐 Navigating to homepage...');
    await page.goto('http://localhost:3000/fr', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for hydration to complete
    console.log('⏳ Waiting for hydration...');
    await page.waitForTimeout(3000);
    
    // Test 1: Check for hydration errors
    console.log('\n📋 Test 1: Checking for hydration errors...');
    const hydrationErrors = errors.filter(error => 
      error.includes('hydration') || 
      error.includes('server HTML') ||
      error.includes('Text content does not match') ||
      error.includes('Expected server HTML')
    );
    
    if (hydrationErrors.length === 0) {
      console.log('✅ No hydration errors detected');
    } else {
      console.log('❌ Hydration errors found:');
      hydrationErrors.forEach(error => console.log('  -', error));
    }
    
    // Test 2: Check for dynamic content consistency
    console.log('\n📋 Test 2: Testing dynamic content consistency...');
    
    // Refresh page and check if content is consistent
    const initialContent = await page.content();
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    const reloadedContent = await page.content();
    
    if (initialContent === reloadedContent) {
      console.log('✅ Page content is consistent after reload');
    } else {
      console.log('⚠️ Page content differs after reload (potential hydration issue)');
    }
    
    // Test 3: Check for client-side only components
    console.log('\n📋 Test 3: Testing client-side components...');
    
    const hasHydrationBoundary = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-hydration-boundary]');
      return elements.length > 0;
    });
    
    // Test 4: Check banner loading
    console.log('\n📋 Test 4: Testing banner component...');
    
    const bannerLoaded = await page.waitForSelector('section', { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    
    if (bannerLoaded) {
      console.log('✅ Banner component loaded successfully');
    } else {
      console.log('❌ Banner component failed to load');
    }
    
    // Test 5: Check form inputs for stable IDs
    console.log('\n📋 Test 5: Testing form input ID stability...');
    
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
    
    console.log('📝 Found input IDs:', inputIds);
    
    // Check if IDs follow our stable pattern
    const hasStableIds = inputIds.every(id => 
      id.startsWith('input-') || id.startsWith('textarea-') || id.includes('stable')
    );
    
    if (hasStableIds || inputIds.length === 0) {
      console.log('✅ Input IDs appear to be stable');
    } else {
      console.log('⚠️ Some input IDs may not be using stable generation');
    }
    
    // Test 6: Check for any remaining Math.random() usage
    console.log('\n📋 Test 6: Testing for random value consistency...');
    
    const pageSource = await page.content();
    const hasRandomValues = pageSource.includes('Math.random()') || 
                           pageSource.includes('crypto.random');
    
    if (!hasRandomValues) {
      console.log('✅ No obvious random value usage in client-side code');
    } else {
      console.log('⚠️ Potential random value usage detected');
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`Total errors: ${errors.length}`);
    console.log(`Hydration errors: ${hydrationErrors.length}`);
    
    if (hydrationErrors.length === 0 && errors.length < 3) {
      console.log('🎉 Hydration tests PASSED! No major issues detected.');
    } else {
      console.log('⚠️ Hydration tests found issues that need attention.');
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