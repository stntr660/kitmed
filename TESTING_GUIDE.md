# KITMED Testing Framework Guide

## Overview

This comprehensive testing framework ensures the reliability, security, and quality of the KITMED medical equipment platform. Given the critical nature of medical equipment systems, our testing strategy emphasizes safety, accessibility, and compliance with medical industry standards.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Categories](#test-categories)
3. [Getting Started](#getting-started)
4. [Test Scripts](#test-scripts)
5. [Writing Tests](#writing-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Medical Industry Compliance](#medical-industry-compliance)
8. [Troubleshooting](#troubleshooting)

## Testing Philosophy

### Medical Equipment Standards

Our testing framework prioritizes:

- **Patient Safety**: All code changes must pass safety-critical tests
- **Regulatory Compliance**: HIPAA, FDA, CE marking requirements
- **Accessibility**: WCAG 2.1 AA compliance for medical professionals
- **Performance**: Critical response times for emergency scenarios
- **Security**: Protection of sensitive medical data

### Test Pyramid

```
    /\        E2E Tests (10%)
   /  \       Integration Tests (20%)
  /____\      Unit Tests (70%)
```

- **Unit Tests (70%)**: Fast, isolated component and function tests
- **Integration Tests (20%)**: API, database, and component integration
- **E2E Tests (10%)**: Critical user workflows and accessibility

## Test Categories

### 1. Unit Tests (`npm run test:unit`)

Located in `__tests__/unit/`

**Purpose**: Test individual components, functions, and utilities in isolation.

**Coverage Areas**:
- React components (ProductCard, RFPForm, etc.)
- Utility functions (data formatting, validation)
- Custom hooks
- Business logic functions

**Example**:
```typescript
// __tests__/unit/components/product-card.test.tsx
describe('ProductCard Component', () => {
  it('renders product information correctly', () => {
    renderWithProviders(<ProductCard product={mockProduct} />);
    expect(screen.getByText(mockProduct.name.en)).toBeInTheDocument();
  });
});
```

### 2. Integration Tests (`npm run test:integration`)

Located in `__tests__/integration/`

**Purpose**: Test component interactions, data flow, and API integration.

**Coverage Areas**:
- Complete user workflows (RFP submission)
- Form state management
- API client integration
- Database operations

**Example**:
```typescript
// __tests__/integration/rfp-workflow.test.tsx
test('user can complete full RFP submission process', async () => {
  // Multi-step workflow testing
  await addProductsToCart();
  await fillCompanyInformation();
  await submitRequest();
  await verifyConfirmation();
});
```

### 3. API Tests (`npm run test:api`)

Located in `__tests__/api/`

**Purpose**: Test API endpoints, data validation, and error handling.

**Coverage Areas**:
- REST API endpoints
- Authentication and authorization
- Input validation
- Error responses
- Database integration

**Example**:
```typescript
// __tests__/api/products.test.ts
describe('GET /api/products', () => {
  it('returns paginated products with default parameters', async () => {
    const response = await GET(mockRequest);
    expect(response.status).toBe(200);
    expect(data.data.items).toHaveLength.greaterThan(0);
  });
});
```

### 4. Accessibility Tests (`npm run test:accessibility`)

Located in `__tests__/accessibility/`

**Purpose**: Ensure WCAG 2.1 AA compliance and medical equipment accessibility.

**Coverage Areas**:
- Color contrast (enhanced for medical interfaces)
- Keyboard navigation
- Screen reader compatibility
- Focus management
- ARIA attributes

**Example**:
```typescript
// __tests__/accessibility/wcag-compliance.test.tsx
it('ProductCard meets WCAG 2.1 AA standards', async () => {
  const { container } = renderWithProviders(<ProductCard product={mockProduct} />);
  const results = await axe(container, axeRulesForMedicalEquipment);
  expect(results).toHaveNoViolations();
});
```

### 5. Security Tests (`npm run test:security`)

Located in `__tests__/security/`

**Purpose**: Validate security measures and prevent vulnerabilities.

**Coverage Areas**:
- XSS prevention
- SQL injection protection
- Authentication security
- Data encryption
- HIPAA compliance

**Example**:
```typescript
// __tests__/security/security-tests.test.ts
it('sanitizes XSS payloads in forms', async () => {
  await user.type(nameInput, '<script>alert("xss")</script>');
  expect(nameInput).not.toHaveValue(expect.stringContaining('<script>'));
});
```

### 6. End-to-End Tests (`npm run test:e2e`)

Located in `e2e/tests/`

**Purpose**: Test complete user journeys in real browser environments.

**Coverage Areas**:
- Critical workflows (product search, RFP submission)
- Admin operations
- Multi-language support
- Mobile responsiveness
- Performance validation

**Example**:
```typescript
// e2e/tests/critical-workflows.spec.ts
test('user can complete full RFP submission process', async ({ page }) => {
  await page.goto('/products');
  await addProductToRFP(page);
  await completeRFPForm(page);
  await verifySubmissionConfirmation(page);
});
```

### 7. Performance Tests (`npm run test:performance`)

**Purpose**: Validate Core Web Vitals and performance requirements.

**Coverage Areas**:
- Page load times
- Core Web Vitals (LCP, FID, CLS)
- Bundle size optimization
- Image optimization
- Network performance

## Getting Started

### Prerequisites

```bash
# Install dependencies
npm install

# Setup test database (for integration tests)
cp .env.example .env.test
# Edit .env.test with test database credentials

# Run database migrations
npx prisma migrate deploy --env .env.test
```

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:api
npm run test:accessibility
npm run test:security
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run E2E tests with UI
npm run test:e2e:ui

# Run performance tests
npm run test:performance
```

## Test Scripts

### Available Scripts

| Script | Purpose | Environment |
|--------|---------|-------------|
| `test` | Run unit tests | jsdom |
| `test:watch` | Run unit tests in watch mode | jsdom |
| `test:coverage` | Run tests with coverage report | jsdom |
| `test:unit` | Run only unit tests | jsdom |
| `test:integration` | Run integration tests | jsdom |
| `test:api` | Run API tests | node |
| `test:e2e` | Run end-to-end tests | browser |
| `test:e2e:ui` | Run E2E tests with Playwright UI | browser |
| `test:e2e:debug` | Debug E2E tests | browser |
| `test:accessibility` | Run accessibility tests | jsdom |
| `test:performance` | Run Lighthouse performance tests | browser |
| `test:security` | Run security validation tests | jsdom |
| `test:all` | Run all test categories | mixed |
| `test:ci` | Run CI test suite | mixed |

### Coverage Thresholds

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## Writing Tests

### Test File Organization

```
__tests__/
├── unit/                    # Unit tests
│   ├── components/         # Component tests
│   ├── hooks/             # Custom hook tests
│   └── utils/             # Utility function tests
├── integration/            # Integration tests
│   ├── workflows/         # User workflow tests
│   └── api-integration/   # API integration tests
├── api/                   # API endpoint tests
├── accessibility/         # WCAG compliance tests
├── security/             # Security validation tests
├── fixtures/             # Test data and mocks
└── utils/               # Test utilities and helpers

e2e/
├── tests/               # E2E test files
├── fixtures/           # E2E test data
└── utils/             # E2E utilities
```

### Test Naming Conventions

```typescript
// Component tests
describe('ComponentName Component', () => {
  describe('Rendering', () => {
    it('renders component with required props', () => {});
    it('renders different states correctly', () => {});
  });
  
  describe('Interactions', () => {
    it('calls callback when action performed', () => {});
    it('updates state on user interaction', () => {});
  });
  
  describe('Accessibility', () => {
    it('meets WCAG standards', () => {});
    it('supports keyboard navigation', () => {});
  });
});

// API tests  
describe('GET /api/endpoint', () => {
  it('returns expected data structure', () => {});
  it('handles query parameters correctly', () => {});
  it('returns proper error responses', () => {});
});

// E2E tests
test.describe('Feature Name', () => {
  test('user can complete primary workflow', () => {});
  test('error handling works correctly', () => {});
});
```

### Medical Equipment Test Patterns

#### Critical Safety Tests

```typescript
describe('Medical Equipment Safety', () => {
  it('validates critical medical data accuracy', () => {
    // Test medical equipment specifications
    // Verify regulatory compliance information
    // Check safety warnings display
  });
  
  it('prevents data corruption in medical records', () => {
    // Test data integrity
    // Verify validation rules
    // Check error handling
  });
});
```

#### Accessibility for Medical Professionals

```typescript
describe('Medical Professional Accessibility', () => {
  it('supports high contrast for clinical environments', () => {
    // Test enhanced color contrast
    // Verify readability in bright clinical lighting
  });
  
  it('enables rapid keyboard navigation for emergency use', () => {
    // Test keyboard shortcuts
    // Verify focus management
    // Check emergency workflow accessibility
  });
});
```

#### Regulatory Compliance Tests

```typescript
describe('Regulatory Compliance', () => {
  it('maintains HIPAA compliance in data handling', () => {
    // Test audit logging
    // Verify access controls
    // Check data encryption
  });
  
  it('displays required FDA/CE marking information', () => {
    // Test regulatory badges
    // Verify certification numbers
    // Check compliance documentation
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow

Our CI/CD pipeline runs comprehensive tests on every pull request and push to main branches:

1. **Parallel Test Execution**: Different test categories run in parallel for speed
2. **Multi-Environment Testing**: Tests run across different Node.js versions and browsers
3. **Security Scanning**: Automated security vulnerability detection
4. **Performance Monitoring**: Lighthouse CI for performance regression detection
5. **Accessibility Validation**: Automated WCAG compliance checking

### Test Reports

- **Coverage Reports**: Generated and uploaded to Codecov
- **Accessibility Reports**: WAVE and axe-core reports
- **Performance Reports**: Lighthouse reports with Core Web Vitals
- **E2E Reports**: Playwright HTML reports with videos and traces
- **Security Reports**: Vulnerability and code quality reports

### Quality Gates

Tests must pass these quality gates before deployment:

- ✅ 80% code coverage minimum
- ✅ Zero accessibility violations
- ✅ Performance scores above thresholds
- ✅ All security tests pass
- ✅ Zero critical vulnerabilities

## Medical Industry Compliance

### HIPAA Compliance Testing

```typescript
describe('HIPAA Compliance', () => {
  it('implements audit logging for all data access', () => {
    // Test audit trail creation
    // Verify log completeness
    // Check log security
  });
  
  it('enforces minimum necessary access principle', () => {
    // Test role-based access
    // Verify data filtering
    // Check permission validation
  });
});
```

### FDA/CE Marking Validation

```typescript
describe('Regulatory Information Display', () => {
  it('displays accurate FDA 510(k) information', () => {
    // Test FDA clearance numbers
    // Verify classification display
    // Check intended use statements
  });
  
  it('shows current CE marking certification', () => {
    // Test CE certificate numbers
    // Verify notified body information
    // Check compliance declarations
  });
});
```

### Medical Device Security Standards

```typescript
describe('Medical Device Security', () => {
  it('implements IEC 62304 software lifecycle processes', () => {
    // Test software classification
    // Verify development processes
    // Check validation documentation
  });
  
  it('follows ISO 14971 risk management principles', () => {
    // Test risk assessment
    // Verify mitigation controls
    // Check safety validation
  });
});
```

## Troubleshooting

### Common Issues

#### Test Environment Setup

```bash
# Clear test cache
npm run test -- --clearCache

# Recreate test database
dropdb kitmed_test && createdb kitmed_test
npx prisma migrate deploy --env .env.test

# Reset node_modules
rm -rf node_modules package-lock.json
npm install
```

#### Mock Data Issues

```typescript
// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  server.resetHandlers();
});
```

#### Accessibility Test Failures

```typescript
// Debug accessibility issues
it('debugs accessibility violations', async () => {
  const results = await axe(container);
  console.log('Accessibility violations:', results.violations);
  // Fix violations before expecting no violations
  expect(results).toHaveNoViolations();
});
```

#### E2E Test Failures

```bash
# Run tests with debug mode
npm run test:e2e:debug

# Generate fresh auth state
rm e2e/fixtures/admin-auth.json
npm run test:e2e -- --headed

# Check test videos and traces
open playwright-report/index.html
```

### Performance Optimization

#### Test Speed

- Use `test.concurrent()` for independent tests
- Mock external API calls
- Use shallow rendering when possible
- Parallel test execution in CI

#### Memory Management

- Clean up timers and event listeners
- Reset global state between tests
- Avoid memory leaks in mocks

### Debug Commands

```bash
# Debug specific test file
npm run test -- ProductCard.test.tsx --verbose

# Debug with additional logging
DEBUG=pw:api npm run test:e2e

# Run single E2E test
npx playwright test critical-workflows.spec.ts --debug

# Generate test coverage report
npm run test:coverage -- --verbose
```

## Best Practices

### Medical Equipment Testing

1. **Safety First**: Always test critical safety features first
2. **Regulatory Compliance**: Include compliance validation in every test
3. **Accessibility**: Test with screen readers and keyboard navigation
4. **Data Integrity**: Verify medical data accuracy and consistency
5. **Performance**: Test under stress conditions similar to clinical environments

### Test Maintenance

1. **Keep Tests Independent**: Each test should run in isolation
2. **Use Descriptive Names**: Test names should explain the expected behavior
3. **Test Edge Cases**: Include boundary conditions and error scenarios
4. **Update Test Data**: Keep mock data current with real-world scenarios
5. **Review Coverage**: Regularly review and improve test coverage

### Security Testing

1. **Test Input Validation**: Verify all user inputs are sanitized
2. **Check Authentication**: Test all auth flows and edge cases
3. **Validate Permissions**: Ensure role-based access controls work
4. **Test Data Encryption**: Verify sensitive data protection
5. **Audit Compliance**: Test audit logging and compliance features

This comprehensive testing framework ensures the KITMED platform meets the highest standards for medical equipment software, providing safe, accessible, and reliable service to healthcare professionals worldwide.