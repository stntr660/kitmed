# Contributing to KITMED

Thank you for your interest in contributing to the KITMED medical equipment platform! This guide will help you understand our development process, coding standards, and how to submit quality contributions.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Quality Standards](#code-quality-standards)
4. [Testing Requirements](#testing-requirements)
5. [Pull Request Process](#pull-request-process)
6. [Code Review Guidelines](#code-review-guidelines)
7. [Release Process](#release-process)
8. [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites
Before contributing, ensure you have:
- Node.js 18.17.0 or higher
- npm 9.6.7 or higher
- Git 2.40.0 or higher
- PostgreSQL 14+ (for local development)
- Basic understanding of TypeScript, React, and Next.js

### Initial Setup
```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/KITMEDAPP.git
cd KITMEDAPP

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/KITMEDAPP.git

# 4. Install dependencies
npm install

# 5. Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# 6. Set up database
npx prisma generate
npx prisma db push
npx prisma db seed

# 7. Start development server
npm run dev
```

### Understanding the Codebase
- **Architecture**: Domain-driven design with clean architecture principles
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL with Prisma schema
- **Testing**: Jest for unit tests, Playwright for E2E tests
- **Deployment**: Vercel-ready with Docker support

## Development Workflow

### Branch Strategy
We use a simplified Git flow:

```
main (production-ready)
├── develop (integration branch)
├── feature/feature-name
├── fix/bug-description
├── docs/documentation-update
└── refactor/code-improvement
```

### Branch Naming Convention
- **Feature branches**: `feature/product-search-enhancement`
- **Bug fixes**: `fix/rfp-cart-persistence-issue`
- **Documentation**: `docs/update-api-documentation`
- **Refactoring**: `refactor/optimize-database-queries`
- **Hotfixes**: `hotfix/critical-security-patch`

### Commit Message Format
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer(s)]
```

#### Types
- `feat`: New feature for the user
- `fix`: Bug fix for the user
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without feature changes
- `test`: Adding or modifying tests
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements
- `ci`: CI/CD pipeline changes

#### Examples
```bash
feat(products): add advanced filtering to product catalog

Added multi-criteria filtering including:
- Category and subcategory filters
- Price range slider
- Availability status
- Featured products toggle

Closes #123

fix(rfp): resolve cart persistence issue on page refresh

The RFP cart was losing items when users refreshed the page.
Fixed by implementing proper localStorage synchronization
and state rehydration on app initialization.

Fixes #456

docs(api): update endpoint documentation for v1.2

- Added new RFP status endpoints
- Updated authentication examples
- Fixed typos in response schemas

chore(deps): update Next.js to version 14.0.3

Security update addressing vulnerability in server components
```

### Feature Development Process

#### 1. Planning Phase
Before starting development:
- **Create Issue**: Document the feature/bug with clear requirements
- **Discussion**: Engage with maintainers for clarification
- **Design Review**: For UI changes, provide mockups or wireframes
- **Technical Design**: For complex features, outline technical approach

#### 2. Development Phase
```bash
# 1. Create and switch to feature branch
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name

# 2. Implement your changes
# Follow coding standards and write tests

# 3. Commit your changes
git add .
git commit -m "feat(scope): description"

# 4. Keep branch updated
git fetch upstream
git rebase upstream/develop

# 5. Push your branch
git push origin feature/your-feature-name
```

#### 3. Testing Phase
```bash
# Run all tests before submitting
npm run test                # Unit tests
npm run test:e2e           # End-to-end tests
npm run type-check         # TypeScript checks
npm run lint               # Code linting
npm run build              # Production build test
```

## Code Quality Standards

### TypeScript Guidelines

#### Type Safety
```typescript
// ✅ Good: Explicit, descriptive types
interface ProductSearchFilters {
  categories?: string[]
  priceRange?: {
    min: number
    max: number
  }
  availability?: 'in-stock' | 'out-of-stock' | 'all'
  featured?: boolean
}

// ❌ Avoid: Any types or unclear interfaces
interface Filters {
  data?: any
  options?: object
}
```

#### Error Handling
```typescript
// ✅ Good: Comprehensive error handling
async function createProduct(data: CreateProductData): Promise<Product> {
  try {
    const validatedData = CreateProductSchema.parse(data)
    const product = await productService.create(validatedData)
    return product
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid product data', error.errors)
    } else if (error instanceof PrismaClientKnownRequestError) {
      throw new DatabaseError('Failed to create product', error.code)
    } else {
      throw new UnexpectedError('Product creation failed')
    }
  }
}

// ❌ Avoid: Silent failures or generic error handling
async function createProduct(data: any) {
  try {
    return await productService.create(data)
  } catch {
    return null
  }
}
```

### React Component Standards

#### Component Structure
```typescript
// components/features/product-catalog/product-card.tsx
import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Product } from '@/types/product'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ProductCardProps {
  product: Product
  onAddToRFP?: (product: Product) => void
  className?: string
  /**
   * Whether to show the detailed view with specifications
   * @default false
   */
  showDetails?: boolean
}

/**
 * ProductCard displays a single product in the catalog
 * with options to add to RFP cart and view details.
 */
export const ProductCard = memo<ProductCardProps>(({
  product,
  onAddToRFP,
  className,
  showDetails = false
}) => {
  const t = useTranslations('product-catalog')

  const handleAddToRFP = () => {
    onAddToRFP?.(product)
  }

  return (
    <Card className={cn('product-card h-full', className)}>
      <CardContent className="p-4">
        {/* Component content */}
      </CardContent>
      <CardFooter>
        <Button onClick={handleAddToRFP} variant="outline" size="sm">
          {t('add-to-rfp')}
        </Button>
      </CardFooter>
    </Card>
  )
})

ProductCard.displayName = 'ProductCard'
```

#### Hooks and State Management
```typescript
// hooks/use-product-search.ts
import { useState, useCallback, useMemo } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { ProductSearchFilters, SearchResult } from '@/types/product'

interface UseProductSearchReturn {
  query: string
  filters: ProductSearchFilters
  results: SearchResult | null
  isLoading: boolean
  error: string | null
  setQuery: (query: string) => void
  setFilters: (filters: Partial<ProductSearchFilters>) => void
  clearFilters: () => void
}

export function useProductSearch(): UseProductSearchReturn {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<ProductSearchFilters>({})
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  const searchParams = useMemo(() => ({
    query: debouncedQuery,
    ...filters
  }), [debouncedQuery, filters])

  const performSearch = useCallback(async () => {
    if (!debouncedQuery && Object.keys(filters).length === 0) {
      setResults(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/products/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams)
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  // ... rest of the hook implementation

  return {
    query,
    filters,
    results,
    isLoading,
    error,
    setQuery,
    setFilters: useCallback((newFilters) => {
      setFilters(prev => ({ ...prev, ...newFilters }))
    }, []),
    clearFilters: useCallback(() => {
      setFilters({})
    }, [])
  }
}
```

### CSS and Styling Guidelines

#### Tailwind CSS Usage
```typescript
// ✅ Good: Semantic grouping and responsive design
<div className="
  flex items-center justify-between 
  p-4 
  bg-white 
  rounded-lg shadow-sm 
  border border-gray-200
  hover:shadow-md 
  transition-shadow duration-200
  md:p-6 
  lg:p-8
">

// ✅ Good: Component variants with CVA
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

#### Custom CSS (When Necessary)
```css
/* styles/components.css */
@layer components {
  .medical-card {
    @apply bg-white border border-gray-200 rounded-lg shadow-sm;
    @apply hover:shadow-md transition-shadow duration-200;
    @apply focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2;
  }

  .medical-gradient {
    background: linear-gradient(135deg, theme('colors.primary') 0%, theme('colors.accent') 100%);
  }

  .medical-prose {
    @apply prose prose-gray max-w-none;
    @apply prose-headings:text-gray-900 prose-headings:font-semibold;
    @apply prose-p:text-gray-700 prose-p:leading-relaxed;
    @apply prose-a:text-primary prose-a:no-underline hover:prose-a:underline;
  }
}
```

### Database and API Standards

#### Prisma Schema Design
```prisma
// prisma/schema.prisma
model Product {
  id                Int               @id @default(autoincrement())
  sku               String            @unique @db.VarChar(50)
  slug              String            @unique @db.VarChar(255)
  
  // Core product information
  name              String            @db.VarChar(255)
  shortDescription  String?           @db.Text
  longDescription   String?           @db.Text
  specifications    Json?
  
  // Categorization
  category          Category          @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  categoryId        Int
  
  // Status and features
  status            ProductStatus     @default(ACTIVE)
  isFeatured        Boolean           @default(false)
  
  // Relationships
  media             ProductMedia[]
  attributes        ProductAttribute[]
  rfpItems          RFPItem[]
  
  // Metadata
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  createdBy         User?             @relation(fields: [createdById], references: [id])
  createdById       Int?
  
  // Indexes for performance
  @@index([categoryId])
  @@index([status])
  @@index([isFeatured])
  @@index([sku])
  @@index([slug])
  @@index([createdAt])
  
  @@map("products")
}

enum ProductStatus {
  ACTIVE
  INACTIVE
  DISCONTINUED
  DRAFT
}
```

#### API Route Standards
```typescript
// app/api/v1/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ProductService } from '@/lib/domains/products/service'
import { validateApiKey, rateLimitMiddleware } from '@/lib/middleware'

const ProductQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('active'),
  featured: z.coerce.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    await rateLimitMiddleware(request, 'public')
    
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const query = ProductQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      featured: searchParams.get('featured'),
    })

    // Execute business logic
    const result = await ProductService.findMany(query)

    // Return standardized response
    return NextResponse.json({
      success: true,
      data: result.products,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    })
  } catch (error) {
    console.error('Product API Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch products',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate admin authentication
    await validateApiKey(request, 'admin')
    
    // Apply rate limiting for admin operations
    await rateLimitMiddleware(request, 'admin')
    
    const body = await request.json()
    const product = await ProductService.create(body)
    
    return NextResponse.json(
      {
        success: true,
        data: product,
        message: 'Product created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    // Error handling logic...
  }
}
```

## Testing Requirements

### Unit Testing with Jest

#### Component Testing
```typescript
// __tests__/components/product-card.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductCard } from '@/components/features/product-catalog/product-card'
import { mockProduct } from '@/test/fixtures/products'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('ProductCard', () => {
  const defaultProps = {
    product: mockProduct,
    onAddToRFP: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders product information correctly', () => {
    render(<ProductCard {...defaultProps} />)
    
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
    expect(screen.getByText(mockProduct.shortDescription)).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('alt', mockProduct.name)
  })

  it('calls onAddToRFP when add button is clicked', () => {
    render(<ProductCard {...defaultProps} />)
    
    fireEvent.click(screen.getByText('add-to-rfp'))
    expect(defaultProps.onAddToRFP).toHaveBeenCalledWith(mockProduct)
  })

  it('shows detailed view when showDetails is true', () => {
    render(<ProductCard {...defaultProps} showDetails />)
    
    expect(screen.getByText('Specifications')).toBeInTheDocument()
    expect(screen.getByText('Technical Details')).toBeInTheDocument()
  })

  it('handles loading state correctly', async () => {
    const slowOnAddToRFP = jest.fn(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )
    
    render(<ProductCard {...defaultProps} onAddToRFP={slowOnAddToRFP} />)
    
    fireEvent.click(screen.getByText('add-to-rfp'))
    expect(screen.getByText('Adding...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('add-to-rfp')).toBeInTheDocument()
    })
  })
})
```

#### Service Testing
```typescript
// __tests__/lib/domains/products/service.test.ts
import { ProductService } from '@/lib/domains/products/service'
import { prismaMock } from '@/test/setup/prisma-mock'
import { mockProduct, createProductData } from '@/test/fixtures/products'

jest.mock('@/lib/database', () => ({
  db: prismaMock,
}))

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('creates product with valid data', async () => {
      prismaMock.product.create.mockResolvedValue(mockProduct)

      const result = await ProductService.create(createProductData)

      expect(prismaMock.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createProductData.name,
          sku: createProductData.sku,
          categoryId: createProductData.categoryId,
        }),
      })
      expect(result).toEqual(mockProduct)
    })

    it('throws validation error for invalid data', async () => {
      const invalidData = { ...createProductData, name: '' }

      await expect(ProductService.create(invalidData)).rejects.toThrow(
        'Product name is required'
      )
    })

    it('throws error for duplicate SKU', async () => {
      prismaMock.product.create.mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`sku`)')
      )

      await expect(ProductService.create(createProductData)).rejects.toThrow(
        'Product with this SKU already exists'
      )
    })
  })

  describe('findMany', () => {
    it('returns paginated products', async () => {
      const mockProducts = [mockProduct]
      prismaMock.product.findMany.mockResolvedValue(mockProducts)
      prismaMock.product.count.mockResolvedValue(1)

      const result = await ProductService.findMany({
        page: 1,
        limit: 20,
      })

      expect(result).toEqual({
        products: mockProducts,
        total: 1,
        page: 1,
        limit: 20,
      })
    })
  })
})
```

### E2E Testing with Playwright

#### Test Structure
```typescript
// tests/e2e/product-catalog.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Product Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products')
  })

  test('should display product grid', async ({ page }) => {
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible()
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(20)
  })

  test('should filter products by category', async ({ page }) => {
    // Click category filter
    await page.click('[data-testid="category-filter-diagnostics"]')
    
    // Wait for results to load
    await page.waitForResponse(/api\/v1\/products/)
    
    // Verify filtered results
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCount(5)
    
    // Verify all products are in the correct category
    const categoryBadges = page.locator('[data-testid="product-category"]')
    await expect(categoryBadges.first()).toHaveText('Diagnostics')
  })

  test('should search products', async ({ page }) => {
    // Enter search term
    await page.fill('[data-testid="search-input"]', 'stethoscope')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Wait for search results
    await page.waitForResponse(/api\/v1\/products\/search/)
    
    // Verify search results
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCount(3)
    
    // Verify search term is highlighted
    await expect(page.locator('[data-testid="search-highlight"]')).toHaveText('stethoscope')
  })

  test('should add product to RFP cart', async ({ page }) => {
    // Click first product's add to RFP button
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-rfp"]')
    
    // Verify cart count updates
    await expect(page.locator('[data-testid="rfp-cart-count"]')).toHaveText('1')
    
    // Open cart and verify product is added
    await page.click('[data-testid="rfp-cart-toggle"]')
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
    
    // Verify product details in cart
    const cartItem = page.locator('[data-testid="cart-item"]').first()
    await expect(cartItem.locator('[data-testid="product-name"]')).toBeVisible()
    await expect(cartItem.locator('[data-testid="product-quantity"]')).toHaveValue('1')
  })
})
```

#### Visual Testing
```typescript
// tests/e2e/visual.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test('homepage layout', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveScreenshot('homepage.png')
  })

  test('product catalog layout', async ({ page }) => {
    await page.goto('/products')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('product-catalog.png')
  })

  test('admin dashboard layout', async ({ page }) => {
    // Login as admin first
    await page.goto('/admin/login')
    await page.fill('[data-testid="email"]', 'admin@kitmed.com')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    
    await page.waitForURL('/admin')
    await expect(page).toHaveScreenshot('admin-dashboard.png')
  })
})
```

### Performance Testing
```typescript
// tests/performance/lighthouse.spec.ts
import { test } from '@playwright/test'
import { playAudit } from 'playwright-lighthouse'

test.describe('Performance Tests', () => {
  test('homepage performance audit', async ({ page }) => {
    await page.goto('/')
    
    await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: 90,
        accessibility: 95,
        'best-practices': 90,
        seo: 90,
      },
    })
  })

  test('product page performance', async ({ page }) => {
    await page.goto('/products/digital-stethoscope-premium')
    
    await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: 85,
        accessibility: 95,
        'best-practices': 90,
        seo: 90,
      },
    })
  })
})
```

## Pull Request Process

### Before Submitting

#### Pre-submission Checklist
- [ ] **Tests Pass**: All unit and E2E tests pass
- [ ] **Type Safety**: No TypeScript errors
- [ ] **Linting**: Code follows ESLint rules
- [ ] **Build Success**: Production build completes
- [ ] **Performance**: No significant performance regressions
- [ ] **Accessibility**: WCAG 2.1 AA compliance maintained
- [ ] **Documentation**: Updated relevant documentation
- [ ] **Changelog**: Added entry if user-facing changes

#### Running Pre-submission Checks
```bash
# Run all checks in one command
npm run pre-commit

# Or run individually
npm run type-check
npm run lint
npm run test
npm run test:e2e
npm run build
npm run lighthouse
```

### Creating a Pull Request

#### PR Title Format
```
type(scope): concise description

# Examples:
feat(products): add advanced filtering to product catalog
fix(rfp): resolve cart persistence issue on page refresh
docs(api): update endpoint documentation for v1.2
refactor(database): optimize product search queries
```

#### PR Description Template
```markdown
## Description
Brief description of what this PR does and why.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- List specific changes made
- Include any new dependencies added
- Mention any breaking changes

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed
- [ ] Performance testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No new warnings introduced
```

### Review Process

#### Automated Checks
Every PR triggers automated checks:
- **Type Checking**: TypeScript compilation
- **Linting**: ESLint and Prettier formatting
- **Unit Tests**: Jest test suite
- **E2E Tests**: Playwright automation
- **Build Test**: Production build verification
- **Security Scan**: Dependency vulnerability check
- **Performance Audit**: Lighthouse CI

#### Manual Review Requirements
- **Code Quality**: Maintainable, readable code
- **Functionality**: Feature works as intended
- **Performance**: No performance regressions
- **Security**: No security vulnerabilities introduced
- **Accessibility**: WCAG compliance maintained
- **Design Consistency**: Follows design system
- **Documentation**: Adequate documentation provided

#### Review Timeline
- **Initial Review**: Within 48 hours
- **Follow-up Reviews**: Within 24 hours
- **Final Approval**: All checks pass and 2 approvals received

## Code Review Guidelines

### For Authors

#### Best Practices
- **Small PRs**: Keep changes focused and reviewable
- **Clear Description**: Explain what and why, not just how
- **Self-Review**: Review your own code first
- **Test Coverage**: Include comprehensive tests
- **Documentation**: Update docs for public APIs

#### Responding to Feedback
- **Be Responsive**: Address feedback promptly
- **Be Open**: Consider alternative approaches
- **Clarify**: Ask questions if feedback is unclear
- **Iterate**: Make requested changes in new commits
- **Communicate**: Explain design decisions when needed

### For Reviewers

#### What to Look For
- **Functionality**: Does the code do what it's supposed to do?
- **Logic**: Is the logic correct and efficient?
- **Style**: Does it follow our coding standards?
- **Testing**: Are there adequate tests?
- **Security**: Are there any security concerns?
- **Performance**: Will this impact performance negatively?

#### Providing Feedback
- **Be Constructive**: Suggest improvements, don't just point out problems
- **Be Specific**: Provide exact line references and explanations
- **Be Educational**: Explain why changes are needed
- **Prioritize**: Distinguish between must-fix and nice-to-have
- **Be Timely**: Review within reasonable timeframes

#### Review Comments Examples
```markdown
// ✅ Good: Constructive with explanation
Consider extracting this logic into a separate function for reusability:
```typescript
function validateProductData(data: ProductData) {
  // validation logic here
}
```

// ✅ Good: Specific security concern
This endpoint is missing authentication. Add the `@requireAuth` decorator:
```typescript
@requireAuth
export async function POST(request: Request) {
  // implementation
}
```

// ❌ Avoid: Vague criticism
This looks wrong.

// ❌ Avoid: Style nitpicking without standards reference
Use single quotes instead of double quotes.
```

## Release Process

### Release Types
- **Major (x.0.0)**: Breaking changes
- **Minor (0.x.0)**: New features, backward compatible
- **Patch (0.0.x)**: Bug fixes, backward compatible

### Release Workflow
```bash
# 1. Create release branch
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Update version numbers
npm version minor

# 3. Update CHANGELOG.md
# Add release notes and migration guide if needed

# 4. Create release PR
git push origin release/v1.2.0
# Create PR from release/v1.2.0 to main

# 5. After approval and merge
git checkout main
git pull origin main
git tag v1.2.0
git push origin v1.2.0

# 6. Merge back to develop
git checkout develop
git merge main
git push origin develop
```

### Changelog Format
```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- Advanced product filtering with multiple criteria
- RFP cart persistence across sessions
- Multi-language support for product specifications

### Changed
- Improved search performance with database optimization
- Updated UI components to use latest design system
- Enhanced error handling across all API endpoints

### Fixed
- Fixed cart persistence issue on page refresh
- Resolved memory leak in product image loading
- Fixed accessibility issues in navigation menu

### Security
- Updated dependencies to address security vulnerabilities
- Implemented rate limiting on public API endpoints
- Added input sanitization for user-generated content

### Breaking Changes
- API response format changed for `/api/v1/products` endpoint
- Migration required: Run `npx prisma migrate deploy`
```

## Community Guidelines

### Code of Conduct
We are committed to providing a welcoming and inclusive environment:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome contributors of all backgrounds and experience levels
- **Be Collaborative**: Work together towards common goals
- **Be Patient**: Help others learn and grow
- **Be Professional**: Maintain professional communication

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community discussions
- **Email**: security@kitmed.com for security-related issues

### Recognition
We value all contributions and recognize contributors through:
- **Contributor List**: Maintained in README.md
- **Release Notes**: Acknowledgment in release announcements
- **Special Recognition**: Outstanding contributions highlighted

### Getting Help
- **Documentation**: Check existing docs first
- **GitHub Discussions**: Ask questions in community discussions
- **Mentorship**: New contributors paired with experienced maintainers

Thank you for contributing to KITMED! Your efforts help improve medical equipment accessibility and efficiency worldwide.