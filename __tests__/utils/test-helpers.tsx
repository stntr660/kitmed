import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Test messages for internationalization
const messages = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    filter: 'Filter',
    reset: 'Reset',
    submit: 'Submit',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
  },
  navigation: {
    home: 'Home',
    products: 'Products',
    about: 'About',
    contact: 'Contact',
    rfp: 'Request Quote',
  },
  products: {
    title: 'Products',
    searchPlaceholder: 'Search products...',
    noResults: 'No products found',
    viewDetails: 'View Details',
    addToRfp: 'Add to RFP',
    specifications: 'Specifications',
    documents: 'Documents',
  },
  rfp: {
    title: 'Request for Proposal',
    cart: 'RFP Cart',
    submit: 'Submit Request',
    addItem: 'Add Item',
    removeItem: 'Remove Item',
    quantity: 'Quantity',
    notes: 'Notes',
  },
  admin: {
    dashboard: 'Dashboard',
    products: 'Products',
    categories: 'Categories',
    manufacturers: 'Manufacturers',
    rfpRequests: 'RFP Requests',
    users: 'Users',
    login: 'Login',
    logout: 'Logout',
  },
  forms: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    minLength: 'Must be at least {min} characters',
    maxLength: 'Must be no more than {max} characters',
  },
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: string;
  queryClient?: QueryClient;
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    locale = 'en',
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Custom hook for creating test query client
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

// Mock router push function
export const mockRouterPush = jest.fn();

// Helper to wait for loading states
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Helper to create form data for file uploads
export function createMockFile(
  name: string = 'test.jpg',
  type: string = 'image/jpeg',
  size: number = 1024
): File {
  const file = new File(['mock file content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

// Helper for testing form submissions
export async function submitForm(form: HTMLFormElement) {
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
  if (submitButton) {
    submitButton.click();
  } else {
    throw new Error('No submit button found in form');
  }
}

// Helper for testing error boundaries
export function ErrorThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

// Helper for testing accessibility
export const axeRulesForMedicalEquipment = {
  // Medical equipment interfaces require high accessibility compliance
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'screen-reader': { enabled: true },
    'aria-labels': { enabled: true },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
};

// Helper for testing responsive design
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  large: { width: 1440, height: 900 },
};

// Helper for testing internationalization
export function renderWithLocale(ui: React.ReactElement, locale: 'en' | 'fr' = 'en') {
  return renderWithProviders(ui, { locale });
}

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => Promise<any>) => {
  const start = performance.now();
  await renderFn();
  const end = performance.now();
  return end - start;
};

// Security testing helpers
export const securityTestCases = {
  xssPayloads: [
    '<script>alert("xss")</script>',
    '"><script>alert("xss")</script>',
    "javascript:alert('xss')",
    '<img src=x onerror=alert("xss")>',
  ],
  sqlInjectionPayloads: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
  ],
  invalidFileTypes: [
    { name: 'malicious.exe', type: 'application/x-executable' },
    { name: 'script.php', type: 'application/x-php' },
    { name: 'payload.js', type: 'application/javascript' },
  ],
};

// Medical equipment specific test helpers
export const medicalEquipmentTestCases = {
  // Critical product information that must be accurate
  criticalFields: [
    'name',
    'sku',
    'manufacturer',
    'specifications',
    'regulatory_info',
    'safety_warnings',
  ],
  
  // Required regulatory compliance checks
  regulatoryRequirements: {
    fda: ['510k', 'pma', 'de_novo'],
    ce: ['class_i', 'class_iia', 'class_iib', 'class_iii'],
    iso: ['iso_13485', 'iso_14971', 'iso_62304'],
  },
  
  // Patient safety critical workflows
  safetyWorkflows: [
    'product_search',
    'specification_review',
    'rfp_submission',
    'quote_generation',
    'order_processing',
  ],
};

// Database test helpers
export const dbTestHelpers = {
  async cleanupTestData() {
    // Mock cleanup - in real tests this would clean test database
    jest.clearAllMocks();
  },
  
  async seedTestData() {
    // Mock seeding - in real tests this would seed test database
    return Promise.resolve();
  },
};

// API test helpers
export const apiTestHelpers = {
  createAuthHeaders: (token: string = 'mock-token') => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }),
  
  createFormDataHeaders: () => ({
    'Authorization': `Bearer mock-token`,
    // Don't set Content-Type for FormData - let browser set it
  }),
  
  mockApiResponse: <T>(data: T, status: number = 200) => ({
    success: status < 400,
    data: status < 400 ? data : undefined,
    error: status >= 400 ? { code: 'ERROR', message: 'Test error' } : undefined,
  }),
};

// Export everything
export * from '@testing-library/react';
export { userEvent };
export { renderWithProviders as render };