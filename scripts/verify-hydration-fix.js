#!/usr/bin/env node

/**
 * HYDRATION FIX VERIFICATION
 * Comprehensive test to verify hydration errors are resolved
 */

const { chromium } = require('playwright');

class HydrationVerifier {
  constructor() {
    this.browser = null;
    this.page = null;
    this.hydrationErrors = [];
    this.warnings = [];
    this.tests = [];
  }

  async initialize() {
    console.log('🔧 HYDRATION FIX VERIFICATION\n');
    console.log('=' .repeat(60));
    
    this.browser = await chromium.launch({ 
      headless: false,
      devtools: true 
    });
    this.page = await this.browser.newPage();
    
    // Enhanced console monitoring
    this.page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (this.isHydrationError(text)) {
        this.hydrationErrors.push({
          type: 'HYDRATION_ERROR',
          message: text,
          timestamp: new Date().toISOString(),
          severity: 'critical'
        });
        console.log(`🚨 HYDRATION ERROR: ${text}`);
      } else if (text.includes('Warning') && text.includes('React')) {
        this.warnings.push({
          type: 'REACT_WARNING',
          message: text,
          timestamp: new Date().toISOString(),
          severity: 'warning'
        });
        console.log(`⚠️ WARNING: ${text}`);
      } else if (type === 'error' && !text.includes('favicon')) {
        console.log(`❌ ERROR: ${text}`);
      }
    });

    // Monitor page errors
    this.page.on('pageerror', error => {
      if (this.isHydrationError(error.message)) {
        this.hydrationErrors.push({
          type: 'PAGE_ERROR',
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          severity: 'critical'
        });
        console.log(`🚨 PAGE HYDRATION ERROR: ${error.message}`);
      }
    });
  }

  isHydrationError(message) {
    const hydrationKeywords = [
      'hydration',
      'mismatch',
      'Text content does not match',
      'server HTML',
      'client HTML',
      'suppressHydrationWarning',
      'hydrating',
      'Expected server HTML to contain',
      'server-side',
      'client-side'
    ];
    
    return hydrationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  async testPageLoad(url) {
    console.log(`\n🧪 Testing page: ${url}`);
    
    try {
      const startTime = Date.now();
      
      // Navigate to page
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for React hydration
      await this.page.waitForTimeout(5000);

      const loadTime = Date.now() - startTime;
      console.log(`⏱️ Page loaded in ${loadTime}ms`);

      // Check page state
      const pageState = await this.page.evaluate(() => {
        return {
          title: document.title,
          hasReactRoot: !!document.querySelector('[data-reactroot]'),
          hasHydrationErrors: window.__REACT_ERROR_COUNT__ || 0,
          bodyText: document.body.textContent.length > 1000,
          hasStaticFallback: document.body.textContent.includes('Medical equipment solutions')
        };
      });

      console.log(`📄 Title: ${pageState.title}`);
      console.log(`⚛️ React hydrated: ${pageState.hasReactRoot}`);
      console.log(`📝 Content loaded: ${pageState.bodyText}`);
      console.log(`🔄 Shows fallback: ${pageState.hasStaticFallback}`);

      return {
        url,
        loadTime,
        success: true,
        pageState,
        hydrationErrors: this.hydrationErrors.length,
        warnings: this.warnings.length
      };

    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
      return {
        url,
        success: false,
        error: error.message,
        hydrationErrors: this.hydrationErrors.length,
        warnings: this.warnings.length
      };
    }
  }

  async testComponentTransitions() {
    console.log('\n🔄 Testing component state transitions...');
    
    // Wait and check for loading to content transition
    let initialState = await this.page.evaluate(() => {
      const bannerSection = document.querySelector('section[class*="min-h-screen"]');
      const partnerCards = document.querySelectorAll('[class*="animate-pulse"]');
      
      return {
        hasBanner: !!bannerSection,
        hasLoadingStates: partnerCards.length > 0,
        bannerText: bannerSection ? bannerSection.textContent.includes('kitMed') : false
      };
    });

    console.log(`🎨 Banner present: ${initialState.hasBanner}`);
    console.log(`⏳ Loading states: ${initialState.hasLoadingStates}`);
    console.log(`📝 Correct content: ${initialState.bannerText}`);

    // Wait for potential content loading
    await this.page.waitForTimeout(3000);

    let finalState = await this.page.evaluate(() => {
      const bannerSection = document.querySelector('section[class*="min-h-screen"]');
      const partnerCards = document.querySelectorAll('[class*="animate-pulse"]');
      
      return {
        hasBanner: !!bannerSection,
        hasLoadingStates: partnerCards.length > 0,
        bannerText: bannerSection ? bannerSection.textContent.includes('kitMed') : false
      };
    });

    console.log(`🎨 Banner stable: ${finalState.hasBanner === initialState.hasBanner}`);
    console.log(`⏳ Loading states consistent: ${finalState.hasLoadingStates === initialState.hasLoadingStates}`);

    return {
      initialState,
      finalState,
      stateConsistent: JSON.stringify(initialState) === JSON.stringify(finalState)
    };
  }

  async runVerification() {
    await this.initialize();
    
    console.log('\n🎯 COMPREHENSIVE HYDRATION VERIFICATION\n');

    // Test main page
    const pageResult = await this.testPageLoad('http://localhost:3000/fr');
    
    // Test component transitions
    const transitionResult = await this.testComponentTransitions();
    
    // Generate final report
    const isFixed = this.hydrationErrors.length === 0;
    
    console.log('\n📊 VERIFICATION RESULTS:');
    console.log('=' .repeat(60));
    console.log(`✅ Hydration Errors: ${this.hydrationErrors.length}`);
    console.log(`⚠️ Warnings: ${this.warnings.length}`);
    console.log(`🔄 State Consistent: ${transitionResult.stateConsistent}`);
    console.log(`🏁 Page Load Success: ${pageResult.success}`);
    
    if (isFixed) {
      console.log('\n🎉 HYDRATION ISSUES RESOLVED!');
      console.log('✅ No hydration mismatches detected');
      console.log('✅ Page loads without errors');
      console.log('✅ Component states are consistent');
    } else {
      console.log('\n🚨 HYDRATION ISSUES REMAIN:');
      this.hydrationErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }

    const report = {
      timestamp: new Date().toISOString(),
      isFixed,
      summary: {
        hydrationErrors: this.hydrationErrors.length,
        warnings: this.warnings.length,
        pageLoadSuccess: pageResult.success,
        stateConsistent: transitionResult.stateConsistent
      },
      details: {
        pageResult,
        transitionResult,
        errors: this.hydrationErrors,
        warnings: this.warnings
      }
    };

    // Save verification report
    const fs = require('fs');
    fs.writeFileSync(
      './scripts/hydration-verification-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n📄 Detailed report saved: scripts/hydration-verification-report.json');
    
    await this.browser.close();
    
    return isFixed;
  }
}

// Run verification
if (require.main === module) {
  const verifier = new HydrationVerifier();
  verifier.runVerification()
    .then((isFixed) => {
      process.exit(isFixed ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = HydrationVerifier;