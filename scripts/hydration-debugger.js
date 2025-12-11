/**
 * ULTRA COMPREHENSIVE HYDRATION DEBUGGER
 * Run this script in browser console to detect hydration mismatches
 * 
 * USAGE:
 * 1. Open browser dev tools
 * 2. Paste this entire script and press Enter
 * 3. The debugger will automatically start monitoring
 * 4. Refresh the page to capture hydration process
 */

(function HydrationDebugger() {
  'use strict';
  
  console.log('%c🚨 HYDRATION DEBUGGER ACTIVATED', 'background: red; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
  
  // State tracking
  let ssrHTML = '';
  let clientHTML = '';
  let hydrationErrors = [];
  let componentStack = [];
  let renderCount = 0;
  
  // Capture initial SSR HTML before React takes over
  function captureSSRHTML() {
    try {
      const mainContent = document.querySelector('main') || document.querySelector('#__next') || document.body;
      ssrHTML = mainContent.innerHTML;
      console.log('%c📸 SSR HTML CAPTURED', 'background: blue; color: white; padding: 5px;');
      console.log('SSR Length:', ssrHTML.length);
    } catch (err) {
      console.error('❌ Failed to capture SSR HTML:', err);
    }
  }
  
  // Capture client-side HTML after hydration
  function captureClientHTML() {
    setTimeout(() => {
      try {
        const mainContent = document.querySelector('main') || document.querySelector('#__next') || document.body;
        clientHTML = mainContent.innerHTML;
        console.log('%c📸 CLIENT HTML CAPTURED', 'background: green; color: white; padding: 5px;');
        console.log('Client Length:', clientHTML.length);
        compareHTMLStructure();
      } catch (err) {
        console.error('❌ Failed to capture Client HTML:', err);
      }
    }, 1000);
  }
  
  // Deep HTML structure comparison
  function compareHTMLStructure() {
    console.log('%c🔍 ANALYZING HTML DIFFERENCES', 'background: purple; color: white; padding: 5px; font-weight: bold;');
    
    const ssrLines = ssrHTML.split('\n').map(line => line.trim()).filter(Boolean);
    const clientLines = clientHTML.split('\n').map(line => line.trim()).filter(Boolean);
    
    const differences = [];
    const maxLines = Math.max(ssrLines.length, clientLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const ssrLine = ssrLines[i] || '';
      const clientLine = clientLines[i] || '';
      
      if (ssrLine !== clientLine) {
        differences.push({
          line: i + 1,
          ssr: ssrLine.substring(0, 200),
          client: clientLine.substring(0, 200),
          type: detectDifferenceType(ssrLine, clientLine)
        });
      }
    }
    
    if (differences.length > 0) {
      console.log('%c⚠️ HYDRATION MISMATCHES DETECTED:', 'background: red; color: white; padding: 5px; font-weight: bold;');
      console.table(differences.slice(0, 10)); // Show first 10 differences
      
      // Analyze patterns
      analyzeHydrationPatterns(differences);
    } else {
      console.log('%c✅ NO STRUCTURAL DIFFERENCES FOUND', 'background: green; color: white; padding: 5px;');
    }
  }
  
  // Detect type of difference
  function detectDifferenceType(ssr, client) {
    if (ssr.includes('class=') && client.includes('class=')) {
      return 'CLASS_MISMATCH';
    }
    if (ssr.includes('data-') !== client.includes('data-')) {
      return 'DATA_ATTRIBUTE';
    }
    if (ssr.includes('style=') !== client.includes('style=')) {
      return 'STYLE_MISMATCH';
    }
    if (ssr.match(/\d{2}:\d{2}/) || client.match(/\d{2}:\d{2}/)) {
      return 'TIME_FORMAT';
    }
    if (ssr.includes('undefined') || client.includes('undefined')) {
      return 'UNDEFINED_VALUE';
    }
    if (ssr.length === 0 || client.length === 0) {
      return 'MISSING_CONTENT';
    }
    return 'UNKNOWN';
  }
  
  // Analyze hydration patterns
  function analyzeHydrationPatterns(differences) {
    const patterns = {};
    
    differences.forEach(diff => {
      patterns[diff.type] = (patterns[diff.type] || 0) + 1;
    });
    
    console.log('%c🔬 HYDRATION ERROR PATTERNS:', 'background: orange; color: black; padding: 5px; font-weight: bold;');
    console.table(patterns);
    
    // Provide specific guidance
    Object.keys(patterns).forEach(pattern => {
      switch (pattern) {
        case 'TIME_FORMAT':
          console.log('%c🕒 TIME/DATE MISMATCH DETECTED', 'color: red; font-weight: bold;');
          console.log('💡 FIX: Check date formatting in components. Use suppressHydrationWarning or format dates consistently.');
          break;
        case 'CLASS_MISMATCH':
          console.log('%c🎨 CSS CLASS MISMATCH DETECTED', 'color: red; font-weight: bold;');
          console.log('💡 FIX: Check for conditional classes or CSS-in-JS that differs between server/client.');
          break;
        case 'UNDEFINED_VALUE':
          console.log('%c⚠️ UNDEFINED VALUES DETECTED', 'color: red; font-weight: bold;');
          console.log('💡 FIX: Check for missing props or state initialization issues.');
          break;
        case 'DATA_ATTRIBUTE':
          console.log('%c📊 DATA ATTRIBUTE MISMATCH', 'color: red; font-weight: bold;');
          console.log('💡 FIX: Check for client-side only data attributes or random IDs.');
          break;
      }
    });
  }
  
  // Monitor React hydration events
  function monitorReactEvents() {
    // Override console.error to catch React hydration warnings
    const originalError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      
      if (message.includes('hydration') || message.includes('mismatch') || message.includes('Text content does not match')) {
        hydrationErrors.push({
          timestamp: new Date().toISOString(),
          message: message,
          stack: new Error().stack
        });
        
        console.log('%c🚨 REACT HYDRATION ERROR CAPTURED:', 'background: red; color: white; padding: 5px; font-weight: bold;');
        console.log(message);
        
        // Try to extract component information
        if (message.includes('in ')) {
          const componentMatch = message.match(/in (\w+)/);
          if (componentMatch) {
            console.log('%c📍 SUSPECTED COMPONENT:', componentMatch[1], 'color: yellow; font-weight: bold;');
          }
        }
      }
      
      originalError.apply(console, args);
    };
  }
  
  // Monitor DOM mutations for hydration timing
  function monitorDOMMutations() {
    if (!window.MutationObserver) return;
    
    const observer = new MutationObserver((mutations) => {
      renderCount++;
      
      if (renderCount === 1) {
        console.log('%c🔄 FIRST DOM MUTATION (Likely hydration start)', 'background: yellow; color: black; padding: 5px;');
        captureClientHTML();
      }
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check for hydration-specific patterns
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              checkElementForHydrationIssues(node);
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    });
    
    console.log('%c👁️ DOM MUTATION OBSERVER ACTIVE', 'background: blue; color: white; padding: 5px;');
  }
  
  // Check specific elements for hydration issues
  function checkElementForHydrationIssues(element) {
    // Check for common hydration issues
    const issues = [];
    
    // Check for undefined text content
    if (element.textContent && element.textContent.includes('undefined')) {
      issues.push('UNDEFINED_TEXT');
    }
    
    // Check for empty required elements
    if (element.tagName === 'IMG' && !element.src) {
      issues.push('EMPTY_IMAGE_SRC');
    }
    
    // Check for missing key attributes
    if (element.hasAttribute('data-reactid') || element.hasAttribute('data-react-checksum')) {
      issues.push('REACT_LEGACY_ATTRIBUTES');
    }
    
    // Check for dynamic IDs
    if (element.id && element.id.match(/\d{13,}/)) {
      issues.push('DYNAMIC_ID');
    }
    
    if (issues.length > 0) {
      console.log('%c⚠️ ELEMENT HYDRATION ISSUES:', 'color: orange; font-weight: bold;', element);
      console.log('Issues:', issues);
    }
  }
  
  // Enhanced error boundary simulation
  function simulateErrorBoundary() {
    window.addEventListener('error', (event) => {
      if (event.message.includes('hydration') || event.message.includes('mismatch')) {
        console.log('%c💥 HYDRATION ERROR CAUGHT BY ERROR BOUNDARY:', 'background: red; color: white; padding: 5px; font-weight: bold;');
        console.log('Error:', event.error);
        console.log('Stack:', event.error?.stack);
        console.log('Element:', event.target);
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('hydration')) {
        console.log('%c💥 HYDRATION PROMISE REJECTION:', 'background: red; color: white; padding: 5px; font-weight: bold;');
        console.log('Reason:', event.reason);
      }
    });
  }
  
  // Component-specific debugging
  function debugSpecificComponents() {
    // Check for Next.js Image components
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.src || img.src.includes('undefined') || img.src === window.location.href) {
        console.log('%c🖼️ PROBLEMATIC IMAGE FOUND:', 'color: red; font-weight: bold;', img);
        console.log('Index:', index, 'Src:', img.src);
      }
    });
    
    // Check for missing text content
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
    textElements.forEach((el, index) => {
      if (el.textContent.trim() === '' && el.innerHTML.trim() !== '') {
        console.log('%c📝 EMPTY TEXT ELEMENT:', 'color: orange; font-weight: bold;', el);
      }
      if (el.textContent.includes('undefined') || el.textContent.includes('null')) {
        console.log('%c⚠️ UNDEFINED/NULL TEXT:', 'color: red; font-weight: bold;', el);
      }
    });
  }
  
  // Performance monitoring
  function monitorHydrationPerformance() {
    if (window.performance && window.performance.mark) {
      window.performance.mark('hydration-debug-start');
      
      setTimeout(() => {
        window.performance.mark('hydration-debug-end');
        try {
          window.performance.measure('hydration-debug', 'hydration-debug-start', 'hydration-debug-end');
          const measure = window.performance.getEntriesByName('hydration-debug')[0];
          console.log('%c⏱️ HYDRATION DEBUG DURATION:', measure.duration.toFixed(2) + 'ms', 'color: blue; font-weight: bold;');
        } catch (e) {
          console.log('Performance measurement not supported');
        }
      }, 5000);
    }
  }
  
  // Generate debugging report
  function generateReport() {
    setTimeout(() => {
      console.log('%c📊 HYDRATION DEBUG REPORT', 'background: navy; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
      console.log('='.repeat(50));
      
      console.log('%c🔍 Summary:', 'font-weight: bold; font-size: 14px;');
      console.log(`• Hydration Errors: ${hydrationErrors.length}`);
      console.log(`• DOM Mutations: ${renderCount}`);
      console.log(`• SSR HTML Length: ${ssrHTML.length}`);
      console.log(`• Client HTML Length: ${clientHTML.length}`);
      
      if (hydrationErrors.length > 0) {
        console.log('%c🚨 Detected Errors:', 'font-weight: bold; color: red;');
        hydrationErrors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.message}`);
        });
      }
      
      console.log('%c💡 Next Steps:', 'font-weight: bold; color: green;');
      console.log('1. Check the components mentioned in error messages');
      console.log('2. Look for date/time formatting inconsistencies');
      console.log('3. Verify client-only code is properly wrapped');
      console.log('4. Check for missing suppressHydrationWarning props');
      
      debugSpecificComponents();
      
      console.log('='.repeat(50));
    }, 3000);
  }
  
  // Initialize all debugging features
  function init() {
    captureSSRHTML();
    monitorReactEvents();
    monitorDOMMutations();
    simulateErrorBoundary();
    monitorHydrationPerformance();
    generateReport();
    
    // Add helper functions to window for manual debugging
    window.hydrationDebug = {
      captureSSR: captureSSRHTML,
      captureClient: captureClientHTML,
      compare: compareHTMLStructure,
      checkElements: debugSpecificComponents,
      getErrors: () => hydrationErrors,
      getSSR: () => ssrHTML,
      getClient: () => clientHTML
    };
    
    console.log('%c🛠️ Helper functions added to window.hydrationDebug', 'color: blue; font-weight: bold;');
    console.log('Available methods:', Object.keys(window.hydrationDebug));
  }
  
  // Start the debugger
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();

console.log('%c🎯 HYDRATION DEBUGGER LOADED - Refresh page to capture hydration process', 'background: green; color: white; padding: 10px; font-size: 14px; font-weight: bold;');