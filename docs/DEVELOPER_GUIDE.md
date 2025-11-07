# KITMED Developer Guide

## Table of Contents
1. [Development Environment Setup](#development-environment-setup)
2. [Project Architecture](#project-architecture)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Component Development](#component-development)
6. [Database & API Development](#database--api-development)
7. [Testing Guidelines](#testing-guidelines)
8. [Performance Optimization](#performance-optimization)
9. [Debugging & Troubleshooting](#debugging--troubleshooting)

## Development Environment Setup

### Prerequisites
- **Node.js**: Version 18.17.0 or higher
- **npm**: Version 9.6.7 or higher (or yarn 1.22.0+)
- **PostgreSQL**: Version 14+ for local development
- **Git**: Version 2.40.0 or higher

### Local Environment Setup

#### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd KITMEDAPP

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

#### 2. Database Setup
```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Create database
createdb kitmed_dev

# Set up Prisma
npx prisma generate
npx prisma db push
npx prisma db seed
```

#### 3. Configure Environment Variables
```bash
# .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/kitmed_dev"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: External services
RESEND_API_KEY="your-resend-api-key"
UPLOADTHING_SECRET="your-uploadthing-secret"
```

#### 4. Start Development Server
```bash
# Start the development server
npm run dev

# Verify installation
open http://localhost:3000
```

### Development Tools Setup

#### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-playwright.playwright",
    "ms-vscode.vscode-jest"
  ]
}
```

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Project Architecture

### Directory Structure Overview
```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   ├── admin/             # Admin panel routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── features/          # Feature-specific components
│   ├── layout/            # Layout components
│   └── common/            # Shared components
├── lib/                   # Core business logic
│   ├── domains/           # Domain-specific modules
│   ├── shared/            # Shared utilities
│   └── hooks/             # Custom React hooks
├── types/                 # TypeScript definitions
├── messages/              # i18n translations
└── styles/                # Global styles
```

### Domain-Driven Architecture

#### Domain Modules Structure
Each domain follows a consistent structure:
```
lib/domains/products/
├── types.ts              # TypeScript interfaces
├── service.ts            # Business logic
├── repository.ts         # Data access layer
└── validation.ts         # Zod schemas
```

#### Clean Architecture Layers
1. **Presentation Layer**: React components, pages
2. **Application Layer**: Server Actions, API routes
3. **Business Layer**: Domain services, validation
4. **Infrastructure Layer**: Database, external APIs

### State Management Strategy

#### Client-Side State (Zustand)
```typescript
// store/rfp-store.ts
interface RFPStore {
  cart: RFPCart
  isOpen: boolean
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  // ...
}
```

#### Server-Side State (React Server Components)
- Data fetching in Server Components
- Server Actions for mutations
- Optimistic updates where appropriate

## Development Workflow

### Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/product-search-enhancement

# 2. Make changes with atomic commits
git add .
git commit -m "feat: enhance product search with filters"

# 3. Keep branch up to date
git rebase main

# 4. Push and create PR
git push origin feature/product-search-enhancement
```

### Commit Message Convention
```
type(scope): description

# Types: feat, fix, docs, style, refactor, test, chore
# Examples:
feat(products): add advanced filtering to product catalog
fix(rfp): resolve cart persistence issue
docs(api): update endpoint documentation
```

### Branch Naming Convention
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements

### Pull Request Process
1. **Create Feature Branch**: From main branch
2. **Implement Changes**: Following coding standards
3. **Write Tests**: Unit and integration tests
4. **Update Documentation**: If applicable
5. **Create PR**: With detailed description
6. **Code Review**: Address feedback
7. **Merge**: Squash merge to main

## Coding Standards

### TypeScript Guidelines

#### Interface Naming
```typescript
// ✅ Good: Clear, descriptive names
interface ProductSearchFilters {
  categories?: string[]
  disciplines?: string[]
  search?: string
}

// ❌ Avoid: Generic or unclear names
interface Filters {
  cats?: string[]
  discs?: string[]
  q?: string
}
```

#### Type Safety
```typescript
// ✅ Good: Strict typing
interface CreateProductRequest {
  name: string
  categoryId: number
  specifications: Record<string, unknown>
}

// ❌ Avoid: Any types
interface CreateProductRequest {
  data: any
}
```

### React Component Guidelines

#### Component Structure
```typescript
// components/features/product-catalog/product-card.tsx
interface ProductCardProps {
  product: Product
  onAddToRFP?: (product: Product) => void
  className?: string
}

export function ProductCard({ 
  product, 
  onAddToRFP, 
  className 
}: ProductCardProps) {
  return (
    <Card className={cn("product-card", className)}>
      {/* Component content */}
    </Card>
  )
}
```

#### Prop Validation
```typescript
// Use Zod for runtime validation when needed
const ProductCardPropsSchema = z.object({
  product: ProductSchema,
  onAddToRFP: z.function().optional(),
  className: z.string().optional(),
})
```

### CSS & Styling Guidelines

#### Tailwind CSS Usage
```typescript
// ✅ Good: Semantic class grouping
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">

// ✅ Good: Component variants with CVA
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
)
```

#### Custom CSS (When Necessary)
```css
/* styles/components.css */
.medical-card {
  @apply bg-white border border-gray-200 rounded-lg shadow-sm;
  @apply hover:shadow-md transition-shadow duration-200;
}

.medical-gradient {
  background: linear-gradient(135deg, #1C75BC 0%, #ED1C24 100%);
}
```

## Component Development

### UI Component Development

#### 1. Base Components (shadcn/ui)
```bash
# Add new shadcn/ui component
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
```

#### 2. Custom Component Creation
```typescript
// components/ui/medical-badge.tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const medicalBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        danger: "bg-red-100 text-red-800",
        medical: "bg-blue-100 text-blue-800",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-sm",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

interface MedicalBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof medicalBadgeVariants> {
  children: React.ReactNode
}

export function MedicalBadge({
  className,
  variant,
  size,
  children,
  ...props
}: MedicalBadgeProps) {
  return (
    <div
      className={cn(medicalBadgeVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
```

### Feature Component Development

#### 1. Component Planning
Before creating a feature component:
- Define clear props interface
- Consider accessibility requirements
- Plan for internationalization
- Design responsive behavior

#### 2. Implementation Template
```typescript
// components/features/rfp/rfp-cart-item.tsx
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Product } from '@/types/product'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface RFPCartItemProps {
  product: Product
  quantity: number
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

export function RFPCartItem({
  product,
  quantity,
  onQuantityChange,
  onRemove
}: RFPCartItemProps) {
  const t = useTranslations('rfp')
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="rfp-cart-item p-4 border-b">
      {/* Component implementation */}
    </div>
  )
}
```

## Database & API Development

### Database Schema Design

#### 1. Prisma Schema Patterns
```prisma
// prisma/schema.prisma
model Product {
  id              Int       @id @default(autoincrement())
  sku             String    @unique
  name            String
  shortDescription String?
  longDescription String?
  specifications  Json?
  
  // Relationships
  category        Category  @relation(fields: [categoryId], references: [id])
  categoryId      Int
  
  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Indexes
  @@index([categoryId])
  @@index([sku])
  @@map("products")
}
```

#### 2. Migration Best Practices
```bash
# Create migration
npx prisma migrate dev --name add_product_specifications

# Reset database (development only)
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy
```

### API Development

#### 1. Server Actions
```typescript
// app/actions/admin/products.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { ProductService } from '@/lib/domains/products/service'
import { CreateProductSchema } from '@/lib/domains/products/validation'

export async function createProduct(data: z.infer<typeof CreateProductSchema>) {
  // 1. Authenticate and authorize
  const session = await getServerSession(authOptions)
  if (!session?.user || !hasPermission(session.user.role, 'product:create')) {
    throw new Error('Unauthorized')
  }

  // 2. Validate input
  const validatedData = CreateProductSchema.parse(data)

  // 3. Execute business logic
  const product = await ProductService.create(validatedData)

  // 4. Revalidate relevant paths
  revalidatePath('/admin/products')
  revalidatePath('/products')

  return product
}
```

#### 2. API Routes
```typescript
// app/api/v1/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ProductService } from '@/lib/domains/products/service'

const ProductQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const query = ProductQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category'),
      search: searchParams.get('search'),
    })

    // Execute business logic
    const result = await ProductService.findMany(query)

    return NextResponse.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
```

## Testing Guidelines

### Unit Testing with Jest

#### 1. Component Testing
```typescript
// __tests__/components/product-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from '@/components/features/product-catalog/product-card'
import { mockProduct } from '@/test/fixtures/products'

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
    expect(screen.getByText(mockProduct.shortDescription)).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('alt', mockProduct.name)
  })

  it('calls onAddToRFP when button is clicked', () => {
    const onAddToRFP = jest.fn()
    render(<ProductCard product={mockProduct} onAddToRFP={onAddToRFP} />)
    
    fireEvent.click(screen.getByText('Add to RFP'))
    expect(onAddToRFP).toHaveBeenCalledWith(mockProduct)
  })
})
```

#### 2. Service Testing
```typescript
// __tests__/lib/domains/products/service.test.ts
import { ProductService } from '@/lib/domains/products/service'
import { prismaMock } from '@/test/setup/prisma-mock'

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates product with valid data', async () => {
    const productData = {
      name: 'Test Product',
      categoryId: 1,
      sku: 'TEST-001',
    }

    prismaMock.product.create.mockResolvedValue({
      id: 1,
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await ProductService.create(productData)
    
    expect(prismaMock.product.create).toHaveBeenCalledWith({
      data: productData,
    })
    expect(result.name).toBe(productData.name)
  })
})
```

### E2E Testing with Playwright

#### 1. Test Configuration
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
```

#### 2. E2E Test Example
```typescript
// tests/e2e/product-search.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Product Search', () => {
  test('should search and filter products', async ({ page }) => {
    await page.goto('/products')
    
    // Search for products
    await page.fill('[data-testid="search-input"]', 'stethoscope')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Verify search results
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(3)
    
    // Apply category filter
    await page.click('[data-testid="category-filter-cardiology"]')
    
    // Verify filtered results
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(2)
  })

  test('should add product to RFP cart', async ({ page }) => {
    await page.goto('/products/stethoscope-premium')
    
    // Add to RFP cart
    await page.click('[data-testid="add-to-rfp-button"]')
    
    // Verify cart update
    await expect(page.locator('[data-testid="rfp-cart-count"]')).toHaveText('1')
    
    // Open cart and verify product
    await page.click('[data-testid="rfp-cart-toggle"]')
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
  })
})
```

## Performance Optimization

### Image Optimization
```typescript
// Optimized image component
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false 
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="rounded-lg object-cover"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    />
  )
}
```

### Bundle Optimization
```typescript
// Dynamic imports for code splitting
import dynamic from 'next/dynamic'

const AdminDashboard = dynamic(
  () => import('@/components/admin/dashboard'),
  {
    loading: () => <div>Loading dashboard...</div>,
    ssr: false
  }
)

const ChartComponent = dynamic(
  () => import('@/components/charts/line-chart'),
  { ssr: false }
)
```

## Debugging & Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database connection
npx prisma db pull

# Reset database schema
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

#### 2. Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Type checking
npm run type-check
```

#### 3. Environment Variables
```bash
# Verify environment variables are loaded
npm run dev -- --debug

# Check for missing variables
echo $DATABASE_URL
```

### Debugging Tools

#### 1. Next.js Debug Mode
```bash
# Start with debug output
NODE_OPTIONS='--inspect' npm run dev

# Enable verbose logging
DEBUG=* npm run dev
```

#### 2. Prisma Debugging
```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Debug specific queries
const result = await prisma.product.findMany({
  where: { categoryId: 1 }
})
console.log('Query result:', result)
```

#### 3. React DevTools
- Install React Developer Tools browser extension
- Use React Profiler for performance analysis
- Enable Strict Mode for development

### Performance Monitoring
```typescript
// lib/monitoring.ts
export function trackPagePerformance(pageName: string) {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0]
      console.log(`${pageName} Load Time:`, navigation.loadEventEnd - navigation.loadEventStart)
    })
  }
}
```

## Development Best Practices

### 1. Code Organization
- Keep components small and focused
- Use custom hooks for reusable logic
- Separate business logic from UI components
- Follow single responsibility principle

### 2. Error Handling
```typescript
// Comprehensive error handling
try {
  const result = await ProductService.create(data)
  return result
} catch (error) {
  if (error instanceof ValidationError) {
    throw new Error('Invalid product data')
  } else if (error instanceof DatabaseError) {
    throw new Error('Database operation failed')
  } else {
    throw new Error('Unexpected error occurred')
  }
}
```

### 3. Type Safety
- Use strict TypeScript configuration
- Define comprehensive interfaces
- Avoid `any` types
- Use Zod for runtime validation

### 4. Accessibility
- Use semantic HTML elements
- Include proper ARIA labels
- Test with screen readers
- Ensure keyboard navigation works

This developer guide provides comprehensive information for setting up, developing, and maintaining the KITMED platform. For additional help, refer to the API documentation and deployment guides.