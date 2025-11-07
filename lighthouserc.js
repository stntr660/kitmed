module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/products',
        'http://localhost:3000/products/intellivue-mp70-patient-monitor',
        'http://localhost:3000/rfp/cart',
        'http://localhost:3000/admin/login',
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      },
    },
    assert: {
      assertions: {
        // Performance thresholds for medical equipment platform
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.95 }], // High accessibility requirements for medical
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        
        // Core Web Vitals - critical for medical equipment interfaces
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // Accessibility specific checks for medical equipment
        'color-contrast': ['error', { minScore: 1 }],
        'heading-order': ['error', { minScore: 1 }],
        'aria-allowed-attr': ['error', { minScore: 1 }],
        'aria-required-attr': ['error', { minScore: 1 }],
        'aria-valid-attr-value': ['error', { minScore: 1 }],
        'button-name': ['error', { minScore: 1 }],
        'form-field-multiple-labels': ['error', { minScore: 1 }],
        'label': ['error', { minScore: 1 }],
        'link-name': ['error', { minScore: 1 }],
        
        // Security and privacy
        'is-on-https': ['error', { minScore: 1 }],
        'redirects-http': ['error', { minScore: 1 }],
        'uses-http2': ['warn', { minScore: 0.8 }],
        
        // Performance budgets for medical equipment images
        'resource-summary:document:size': ['warn', { maxNumericValue: 50000 }],
        'resource-summary:image:size': ['warn', { maxNumericValue: 1000000 }],
        'resource-summary:script:size': ['warn', { maxNumericValue: 500000 }],
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 100000 }],
        
        // Progressive Web App features
        'service-worker': ['warn', { minScore: 0.5 }],
        'offline-start-url': ['warn', { minScore: 0.5 }],
        'installable-manifest': ['warn', { minScore: 0.5 }],
        
        // Medical equipment specific performance
        'interactive': ['error', { maxNumericValue: 4000 }], // Critical for medical interfaces
        'speed-index': ['error', { maxNumericValue: 3500 }],
        'max-potential-fid': ['error', { maxNumericValue: 130 }], // Fast interaction for emergency scenarios
        
        // Image optimization
        'modern-image-formats': ['warn', { minScore: 0.8 }],
        'offscreen-images': ['warn', { minScore: 0.8 }],
        'uses-optimized-images': ['warn', { minScore: 0.8 }],
        'uses-responsive-images': ['warn', { minScore: 0.8 }],
        
        // JavaScript and CSS optimization
        'unused-javascript': ['warn', { maxNumericValue: 100000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 50000 }],
        'unminified-css': ['error', { minScore: 1 }],
        'unminified-javascript': ['error', { minScore: 1 }],
        
        // Network optimization
        'uses-text-compression': ['error', { minScore: 1 }],
        'efficient-animated-content': ['warn', { minScore: 0.8 }],
        'legacy-javascript': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
    server: {
      command: 'npm run build && npm run start',
      port: 3000,
      waitForPort: true,
      waitForScheme: 'http',
    },
  },
};