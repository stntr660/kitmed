#!/usr/bin/env node

/**
 * HYDRATION DETECTIVE
 * Systematic root cause analysis for hydration errors
 * Tests each component in isolation to find exact mismatch source
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class HydrationDetective {
  constructor() {
    this.browser = null;
    this.page = null;
    this.errors = [];
    this.warnings = [];
    this.components = [];
  }

  async initialize() {
    console.log('🕵️ Starting Hydration Detective...\n');
    this.browser = await chromium.launch({ 
      headless: false,
      devtools: true 
    });
    this.page = await this.browser.newPage();
    
    // Capture all console messages
    this.page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (text.includes('hydrat') || text.includes('mismatch') || text.includes('server') && text.includes('client')) {
        if (type === 'error') {
          this.errors.push({
            type: 'error',
            message: text,
            timestamp: new Date().toISOString()
          });
        } else if (type === 'warning') {
          this.warnings.push({
            type: 'warning', 
            message: text,
            timestamp: new Date().toISOString()
          });
        }
        console.log(`🚨 ${type.toUpperCase()}: ${text}`);
      }
    });
  }

  async testPage(url) {
    console.log(`🔍 Testing page: ${url}\n`);
    
    try {
      // Navigate to page
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for potential hydration
      await this.page.waitForTimeout(3000);

      // Check if page loaded correctly
      const title = await this.page.title();
      console.log(`📄 Page title: ${title}`);

      // Capture initial HTML structure
      const initialHTML = await this.page.evaluate(() => {
        return document.documentElement.outerHTML;
      });

      // Check for React DevTools errors
      const reactErrors = await this.page.evaluate(() => {
        return window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ? 
          window.__REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces?.size || 0 : 0;
      });

      console.log(`⚛️ React renderers detected: ${reactErrors}`);

      // Look for specific hydration patterns in DOM
      const hydrationIssues = await this.page.evaluate(() => {
        const issues = [];
        
        // Check for duplicate IDs (common hydration issue)
        const ids = {};
        document.querySelectorAll('[id]').forEach(el => {
          if (ids[el.id]) {
            issues.push(`Duplicate ID: ${el.id}`);
          } else {
            ids[el.id] = true;
          }
        });

        // Check for mismatched text content
        const textNodes = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while (node = textNodes.nextNode()) {
          if (node.textContent.includes('{{') || node.textContent.includes('undefined')) {
            issues.push(`Unresolved text: ${node.textContent.trim()}`);
          }
        }

        // Check for React error boundaries
        const errorBoundaries = document.querySelectorAll('[data-react-error-boundary]');
        if (errorBoundaries.length > 0) {
          issues.push(`Found ${errorBoundaries.length} error boundaries`);
        }

        return issues;
      });

      if (hydrationIssues.length > 0) {
        console.log('🔴 DOM Issues Found:');
        hydrationIssues.forEach(issue => console.log(`  - ${issue}`));
      }

      return {
        url,
        title,
        errors: this.errors.length,
        warnings: this.warnings.length,
        domIssues: hydrationIssues,
        hasHydrationErrors: this.errors.some(e => 
          e.message.includes('hydrat') || 
          e.message.includes('mismatch') ||
          e.message.includes('server') && e.message.includes('client')
        )
      };

    } catch (error) {
      console.error(`❌ Error testing page: ${error.message}`);
      return {
        url,
        error: error.message,
        hasHydrationErrors: true
      };
    }
  }

  async testComponent(componentName, selector) {
    console.log(`🧩 Testing component: ${componentName}`);
    
    // Wait for component to be present
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      
      // Check component's HTML structure
      const componentHTML = await this.page.evaluate((sel) => {
        const element = document.querySelector(sel);
        return element ? element.outerHTML : null;
      }, selector);

      // Check for component-specific issues
      const componentIssues = await this.page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (!element) return ['Component not found'];

        const issues = [];
        
        // Check for missing content
        if (element.textContent.trim() === '') {
          issues.push('Empty component content');
        }

        // Check for hydration attributes
        if (element.hasAttribute('data-reactroot')) {
          issues.push('Has React root attribute');
        }

        // Check for suppressHydrationWarning
        if (element.hasAttribute('suppressHydrationWarning')) {
          issues.push('Has suppressHydrationWarning');
        }

        return issues;
      }, selector);

      return {
        component: componentName,
        selector,
        present: true,
        issues: componentIssues,
        html: componentHTML ? componentHTML.substring(0, 500) + '...' : null
      };

    } catch (error) {
      return {
        component: componentName,
        selector,
        present: false,
        error: error.message
      };
    }
  }

  async runFullAnalysis() {
    await this.initialize();
    
    console.log('🎯 HYDRATION ROOT CAUSE ANALYSIS\n');
    console.log('=' .repeat(60) + '\n');

    // Test main page
    const pageResult = await this.testPage('http://localhost:3000/fr');
    
    console.log('\n📊 RESULTS:');
    console.log('=' .repeat(60));
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    console.log(`Has Hydration Issues: ${pageResult.hasHydrationErrors}\n`);

    // Test critical components
    const componentsToTest = [
      { name: 'DynamicBanner', selector: 'section[class*="min-h-screen"]' },
      { name: 'Header', selector: 'header' },
      { name: 'Footer', selector: 'footer' },
      { name: 'RFPCart', selector: '[role="region"][aria-label*="Notifications"]' },
      { name: 'Main Content', selector: 'main' }
    ];

    console.log('🧩 COMPONENT ANALYSIS:');
    console.log('-' .repeat(60));
    
    for (const comp of componentsToTest) {
      const result = await this.testComponent(comp.name, comp.selector);
      console.log(`${comp.name}: ${result.present ? '✅ Present' : '❌ Missing'}`);
      if (result.issues && result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`  ⚠️ ${issue}`));
      }
    }

    // Generate detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        hasHydrationErrors: pageResult.hasHydrationErrors,
        url: pageResult.url
      },
      errors: this.errors,
      warnings: this.warnings,
      pageAnalysis: pageResult,
      componentAnalysis: await Promise.all(
        componentsToTest.map(comp => this.testComponent(comp.name, comp.selector))
      )
    };

    // Save report
    fs.writeFileSync(
      path.join(__dirname, 'hydration-detective-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📋 DIAGNOSTIC SUMMARY:');
    console.log('=' .repeat(60));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ NO HYDRATION ERRORS DETECTED');
      console.log('✅ All components loaded successfully');
    } else {
      console.log('🚨 HYDRATION ISSUES DETECTED:');
      console.log(`   • ${this.errors.length} errors`);
      console.log(`   • ${this.warnings.length} warnings`);
      
      console.log('\n📍 FIRST ERROR LOCATION:');
      if (this.errors.length > 0) {
        console.log(`   ${this.errors[0].message}`);
      }
    }

    console.log(`\n📄 Full report saved: hydration-detective-report.json`);
    
    await this.browser.close();
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const detective = new HydrationDetective();
  detective.runFullAnalysis()
    .then((report) => {
      process.exit(report.summary.hasHydrationErrors ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Detective failed:', error);
      process.exit(1);
    });
}

module.exports = HydrationDetective;