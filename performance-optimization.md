# KITMED Performance Optimization Plan

## Core Performance Strategy

### 1. Next.js Optimization

#### Static Generation for Product Catalog
```typescript
// app/products/[discipline]/[category]/page.tsx
export const revalidate = 3600 // 1 hour ISR

export async function generateStaticParams() {
  // Pre-generate top 100 product pages
  const topProducts = await getTopProducts(100)
  return topProducts.map((product) => ({
    discipline: product.discipline.slug,
    category: product.category.slug,
    sku: product.sku,
  }))
}

// Generate remaining pages on-demand
export const dynamicParams = true

export default async function ProductPage({ params }) {
  const product = await getProduct(params.sku)
  
  if (!product) {
    notFound()
  }
  
  return <ProductDetail product={product} />
}
```

#### Streaming and Suspense
```typescript
// app/products/page.tsx
import { Suspense } from 'react'
import { ProductGrid } from '@/components/features/product-catalog/product-grid'
import { ProductFilters } from '@/components/features/product-catalog/product-filters'

export default function ProductsPage({ searchParams }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside className="lg:col-span-1">
        <Suspense fallback={<FiltersSkeleton />}>
          <ProductFilters />
        </Suspense>
      </aside>
      
      <main className="lg:col-span-3">
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  )
}
```

#### Image Optimization
```typescript
// components/common/optimized-image.tsx
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false,
  className 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={85}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoadingComplete={() => setIsLoading(false)}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}
```

### 2. Database Performance

#### Optimized Queries with Indexes
```sql
-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_products_category_active_sort 
ON products(category_id, is_active, sort_order) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_products_search_performance 
ON products USING GIN(
  (setweight(to_tsvector('french', name_fr), 'A') ||
   setweight(to_tsvector('french', COALESCE(description_fr, '')), 'B'))
);

-- Partial indexes for admin queries
CREATE INDEX CONCURRENTLY idx_rfps_admin_active 
ON rfps(status, created_at DESC) 
WHERE status IN ('pending', 'in_progress');

-- Covering indexes to avoid table lookups
CREATE INDEX CONCURRENTLY idx_products_catalog_cover 
ON products(category_id, is_active) 
INCLUDE (id, sku, name_fr, name_en, image_url, sort_order)
WHERE is_active = true;
```

#### Query Optimization
```typescript
// lib/domains/products/repository.ts
export class ProductRepository {
  async getProductsByCategory(
    categoryId: number,
    { page = 1, limit = 20, search }: PaginationParams & { search?: string }
  ) {
    const offset = (page - 1) * limit
    
    let query = this.db.product.findMany({
      where: {
        categoryId,
        isActive: true,
        ...(search && {
          OR: [
            { nameFr: { contains: search, mode: 'insensitive' } },
            { nameEn: { contains: search, mode: 'insensitive' } },
            { descriptionFr: { contains: search, mode: 'insensitive' } },
            { descriptionEn: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        sku: true,
        nameFr: true,
        nameEn: true,
        shortDescriptionFr: true,
        shortDescriptionEn: true,
        images: true,
        sortOrder: true,
        category: {
          select: {
            id: true,
            slug: true,
            nameFr: true,
            nameEn: true,
            discipline: {
              select: {
                id: true,
                slug: true,
                nameFr: true,
                nameEn: true,
              },
            },
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { nameFr: 'asc' },
      ],
      skip: offset,
      take: limit,
    })
    
    return query
  }
  
  // Optimized search with full-text search
  async searchProducts(searchTerm: string, filters: SearchFilters) {
    const searchQuery = searchTerm
      .split(' ')
      .map(term => `${term}:*`)
      .join(' & ')
    
    return this.db.$queryRaw`
      SELECT 
        p.id, p.sku, p.name_fr, p.name_en, p.images,
        c.slug as category_slug, d.slug as discipline_slug,
        ts_rank(
          setweight(to_tsvector('french', p.name_fr), 'A') ||
          setweight(to_tsvector('french', COALESCE(p.description_fr, '')), 'B'),
          to_tsquery('french', ${searchQuery})
        ) as rank
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN disciplines d ON c.discipline_id = d.id
      WHERE p.is_active = true
        AND (
          to_tsvector('french', p.name_fr) @@ to_tsquery('french', ${searchQuery})
          OR to_tsvector('french', COALESCE(p.description_fr, '')) @@ to_tsquery('french', ${searchQuery})
        )
        ${filters.categoryId ? Prisma.sql`AND p.category_id = ${filters.categoryId}` : Prisma.empty}
        ${filters.disciplineId ? Prisma.sql`AND c.discipline_id = ${filters.disciplineId}` : Prisma.empty}
      ORDER BY rank DESC, p.sort_order ASC
      LIMIT ${filters.limit} OFFSET ${filters.offset}
    `
  }
}
```

#### Connection Pooling
```typescript
// lib/database.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling configuration
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Connection pool size based on environment
const connectionLimit = process.env.NODE_ENV === 'production' ? 10 : 5
```

### 3. Frontend Performance

#### Lazy Loading and Code Splitting
```typescript
// components/features/product-catalog/product-detail.tsx
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Lazy load heavy components
const ProductSpecifications = dynamic(
  () => import('./product-specifications').then(mod => ({ default: mod.ProductSpecifications })),
  { 
    loading: () => <SpecificationsSkeleton />,
    ssr: false // Don't SSR heavy components
  }
)

const ProductDocuments = dynamic(
  () => import('./product-documents').then(mod => ({ default: mod.ProductDocuments })),
  { loading: () => <DocumentsSkeleton /> }
)

export function ProductDetail({ product }: { product: Product }) {
  return (
    <div>
      {/* Critical above-the-fold content */}
      <ProductHeader product={product} />
      <ProductImages images={product.images} />
      
      {/* Lazy loaded below-the-fold content */}
      <Suspense fallback={<SpecificationsSkeleton />}>
        <ProductSpecifications specifications={product.specifications} />
      </Suspense>
      
      <Suspense fallback={<DocumentsSkeleton />}>
        <ProductDocuments documents={product.documents} />
      </Suspense>
    </div>
  )
}
```

#### Virtual Scrolling for Large Lists
```typescript
// components/features/product-catalog/virtual-product-grid.tsx
import { FixedSizeGrid as Grid } from 'react-window'
import { useMemo } from 'react'

interface VirtualProductGridProps {
  products: Product[]
  itemWidth: number
  itemHeight: number
  containerHeight: number
  containerWidth: number
}

export function VirtualProductGrid({
  products,
  itemWidth,
  itemHeight,
  containerHeight,
  containerWidth,
}: VirtualProductGridProps) {
  const columnCount = Math.floor(containerWidth / itemWidth)
  const rowCount = Math.ceil(products.length / columnCount)
  
  const Cell = useMemo(() => 
    ({ columnIndex, rowIndex, style }: any) => {
      const index = rowIndex * columnCount + columnIndex
      const product = products[index]
      
      if (!product) return null
      
      return (
        <div style={style}>
          <ProductCard product={product} />
        </div>
      )
    }, [products, columnCount]
  )
  
  return (
    <Grid
      columnCount={columnCount}
      columnWidth={itemWidth}
      height={containerHeight}
      rowCount={rowCount}
      rowHeight={itemHeight}
      width={containerWidth}
    >
      {Cell}
    </Grid>
  )
}
```

#### Optimistic Updates for RFP Cart
```typescript
// hooks/use-rfp-cart.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface RFPCartState {
  items: RFPItem[]
  isLoading: boolean
  addItem: (product: Product, quantity?: number) => Promise<void>
  removeItem: (productId: number) => Promise<void>
  updateQuantity: (productId: number, quantity: number) => Promise<void>
}

export const useRFPCart = create<RFPCartState>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        isLoading: false,
        
        addItem: async (product, quantity = 1) => {
          // Optimistic update
          set(state => ({
            items: [...state.items, { product, quantity, id: Date.now() }]
          }))
          
          try {
            // Sync with server
            await addToRFPCartAction(product.id, quantity)
          } catch (error) {
            // Rollback on error
            set(state => ({
              items: state.items.filter(item => item.product.id !== product.id)
            }))
            throw error
          }
        },
        
        removeItem: async (productId) => {
          const currentItems = get().items
          
          // Optimistic update
          set(state => ({
            items: state.items.filter(item => item.product.id !== productId)
          }))
          
          try {
            await removeFromRFPCartAction(productId)
          } catch (error) {
            // Rollback on error
            set({ items: currentItems })
            throw error
          }
        },
      }),
      { name: 'rfp-cart-storage' }
    )
  )
)
```

### 4. Asset Optimization

#### Next.js Bundle Analysis
```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.kitmed.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Enable SWC minification
  swcMinify: true,
  
  // Optimize chunks
  experimental: {
    optimizeCss: true,
  },
  
  // Compression
  compress: true,
  
  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
})
```

#### Font Optimization
```typescript
// app/layout.tsx
import { Inter, Open_Sans } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${openSans.variable}`}>
      <body className="font-inter">
        {children}
      </body>
    </html>
  )
}
```

### 5. Performance Monitoring

#### Core Web Vitals Tracking
```typescript
// lib/performance.ts
export function reportWebVitals({ id, name, value, label }: any) {
  // Send to analytics service
  if (process.env.NODE_ENV === 'production') {
    window.gtag?.('event', name, {
      event_category: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      event_label: id,
      non_interaction: true,
    })
  }
}

// app/_app.tsx (if using pages router) or use in component
export { reportWebVitals } from '../lib/performance'
```

#### Performance Budget
```javascript
// performance-budget.config.js
module.exports = {
  budgets: [
    {
      path: '/',
      resourceSizes: [
        { resourceType: 'script', maximumSizeInBytes: 300000 },
        { resourceType: 'total', maximumSizeInBytes: 1000000 },
      ],
      resourceCounts: [
        { resourceType: 'script', maximum: 10 },
        { resourceType: 'image', maximum: 20 },
      ],
    },
    {
      path: '/products/**',
      resourceSizes: [
        { resourceType: 'script', maximumSizeInBytes: 250000 },
        { resourceType: 'image', maximumSizeInBytes: 500000 },
      ],
    },
  ],
}
```

### 6. Performance Targets

#### Core Metrics Goals
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Time to Interactive (TTI)**: < 3s

#### API Performance Goals
- **Database queries**: < 100ms average
- **Search queries**: < 200ms average
- **File uploads**: < 5s for 10MB
- **Page generation**: < 500ms SSG, < 1s SSR

#### Lighthouse Score Targets
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 95