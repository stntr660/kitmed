# KITMED API Documentation

A comprehensive RESTful API for the KITMED medical equipment platform, supporting both public front-office operations and protected back-office administration.

## API Architecture Overview

**Base URL**: `/api/v1`  
**Authentication**: JWT tokens for admin routes  
**Response Format**: JSON with consistent error handling  
**Rate Limiting**: 100 requests/minute per IP (public), 500 requests/minute (admin)  
**API Version**: v1.0  
**Content-Type**: application/json

```typescript
// Standard API Response Format
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

## 1. PUBLIC API ENDPOINTS (Front Office)

### 1.1 Product Catalog

#### GET /api/v1/products
**Purpose**: Get paginated product list with filtering
```typescript
// Query Parameters
interface ProductQuery {
  page?: number          // Default: 1
  limit?: number         // Default: 20, Max: 100
  category?: string      // Category slug
  search?: string        // Search in name/description
  featured?: boolean     // Filter featured products
  language?: 'fr' | 'en' // Default: 'fr'
}

// Response
interface ProductListResponse {
  products: Array<{
    id: string
    sku: string
    name: string
    slug: string
    shortDescription: string
    primaryImage?: string
    category: {
      name: string
      slug: string
    }
    isFeatured: boolean
  }>
  pagination: PaginationInfo
}
```

#### GET /api/v1/products/[slug]
**Purpose**: Get detailed product information
```typescript
// Response
interface ProductDetailResponse {
  id: string
  sku: string
  name: string
  slug: string
  shortDescription: string
  longDescription: string
  specifications: Record<string, any>
  category: {
    id: string
    name: string
    slug: string
    breadcrumb: Array<{ name: string; slug: string }>
  }
  media: Array<{
    type: 'image' | 'document' | 'video'
    url: string
    title?: string
    altText?: string
    isPrimary: boolean
  }>
  attributes: Array<{
    name: string
    value: string
    type: string
  }>
  relatedProducts: Array<{
    id: string
    name: string
    slug: string
    primaryImage?: string
  }>
}
```

#### GET /api/v1/products/search
**Purpose**: Advanced product search with facets
```typescript
// Query Parameters
interface SearchQuery {
  q: string              // Search query
  category?: string[]    // Multiple categories
  attributes?: Record<string, string[]> // Faceted search
  page?: number
  limit?: number
  sort?: 'name' | 'featured' | 'newest'
  language?: 'fr' | 'en'
}

// Response includes facets for filtering
interface SearchResponse {
  products: ProductListResponse['products']
  facets: {
    categories: Array<{
      slug: string
      name: string
      count: number
    }>
    attributes: Record<string, Array<{
      value: string
      count: number
    }>>
  }
  pagination: PaginationInfo
}
```

### 1.2 Categories

#### GET /api/v1/categories
**Purpose**: Get category hierarchy for navigation
```typescript
// Query Parameters
interface CategoryQuery {
  parent?: string        // Parent category slug
  depth?: number         // Tree depth (default: all)
  language?: 'fr' | 'en'
}

// Response
interface CategoryTreeResponse {
  categories: Array<{
    id: string
    name: string
    slug: string
    description?: string
    image?: string
    productCount: number
    children?: CategoryTreeResponse['categories']
  }>
}
```

#### GET /api/v1/categories/[slug]
**Purpose**: Get category details with products
```typescript
// Response
interface CategoryDetailResponse {
  id: string
  name: string
  slug: string
  description: string
  image?: string
  breadcrumb: Array<{ name: string; slug: string }>
  children: Array<{
    name: string
    slug: string
    productCount: number
  }>
  products: ProductListResponse['products']
  pagination: PaginationInfo
}
```

### 1.3 RFP System

#### POST /api/v1/rfp
**Purpose**: Submit new RFP request
```typescript
// Request Body
interface RFPSubmission {
  customerInfo: {
    name: string
    email: string
    phone?: string
    companyName?: string
    companyAddress?: string
    contactPerson?: string
  }
  items: Array<{
    productId: string
    quantity: number
    specialRequirements?: string
  }>
  message?: string
  urgencyLevel?: 'low' | 'normal' | 'high' | 'urgent'
  preferredContactMethod?: 'email' | 'phone' | 'both'
}

// Response
interface RFPSubmissionResponse {
  referenceNumber: string
  message: string
  estimatedResponseTime: string
}
```

#### GET /api/v1/rfp/[referenceNumber]
**Purpose**: Get RFP status (public, no auth required)
```typescript
// Response
interface RFPStatusResponse {
  referenceNumber: string
  status: 'pending' | 'processing' | 'quoted' | 'closed'
  submittedAt: string
  itemCount: number
  message?: string
}
```

### 1.4 Content & Pages

#### GET /api/v1/pages/[slug]
**Purpose**: Get dynamic page content
```typescript
// Response
interface PageResponse {
  title: string
  content: string
  metaTitle?: string
  metaDescription?: string
  lastUpdated: string
}
```

#### GET /api/v1/partners
**Purpose**: Get partner showcase
```typescript
// Response
interface PartnerResponse {
  partners: Array<{
    id: string
    name: string
    slug: string
    description?: string
    logoUrl?: string
    websiteUrl?: string
    isFeatured: boolean
  }>
}
```

#### GET /api/v1/banners
**Purpose**: Get active banners for position
```typescript
// Query Parameters
interface BannerQuery {
  position?: string      // 'homepage', 'category', 'product'
  language?: 'fr' | 'en'
}

// Response
interface BannerResponse {
  banners: Array<{
    id: string
    title: string
    subtitle?: string
    imageUrl?: string
    ctaText?: string
    ctaUrl?: string
    position: string
  }>
}
```

## 2. ADMIN API ENDPOINTS (Back Office)

**Authentication Required**: All admin endpoints require JWT token
**Authorization**: Role-based access (admin, editor, viewer)

### 2.1 Authentication

#### POST /api/v1/admin/auth/login
**Purpose**: Admin login
```typescript
// Request Body
interface LoginRequest {
  email: string
  password: string
}

// Response
interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: 'admin' | 'editor' | 'viewer'
  }
  expiresAt: string
}
```

#### POST /api/v1/admin/auth/logout
**Purpose**: Invalidate current session
```typescript
// No body required, token from header
// Response: { success: true, message: "Logged out successfully" }
```

#### GET /api/v1/admin/auth/me
**Purpose**: Get current user info
```typescript
// Response: Same as LoginResponse.user
```

### 2.2 Product Management

#### GET /api/v1/admin/products
**Purpose**: Get products for admin dashboard
```typescript
// Query Parameters (extends public ProductQuery)
interface AdminProductQuery extends ProductQuery {
  status?: 'active' | 'inactive' | 'discontinued' | 'all'
  includeInactive?: boolean
}

// Response includes admin-specific fields
interface AdminProductResponse {
  products: Array<{
    // ... public fields ...
    status: string
    createdAt: string
    updatedAt: string
    createdBy?: string
  }>
  pagination: PaginationInfo
}
```

#### POST /api/v1/admin/products
**Purpose**: Create new product
```typescript
// Request Body
interface CreateProductRequest {
  sku: string
  categoryId: string
  name: string
  slug?: string  // Auto-generated if not provided
  shortDescription?: string
  longDescription?: string
  specifications?: Record<string, any>
  status?: 'active' | 'inactive'
  isFeatured?: boolean
  translations?: Record<string, {
    name: string
    shortDescription?: string
    longDescription?: string
    specifications?: Record<string, any>
  }>
  attributes?: Array<{
    name: string
    value: string
    type: string
  }>
}

// Response: Complete product object
```

#### PUT /api/v1/admin/products/[id]
**Purpose**: Update existing product
```typescript
// Request Body: Same as CreateProductRequest (all fields optional)
// Response: Updated product object
```

#### DELETE /api/v1/admin/products/[id]
**Purpose**: Delete product (soft delete)
```typescript
// Response: { success: true, message: "Product deleted" }
```

#### POST /api/v1/admin/products/bulk-import
**Purpose**: Bulk import products from CSV
```typescript
// Content-Type: multipart/form-data
// Form field: file (CSV file)

// Response
interface BulkImportResponse {
  imported: number
  failed: number
  errors?: Array<{
    row: number
    field: string
    message: string
  }>
}
```

#### GET /api/v1/admin/products/export
**Purpose**: Export products to CSV
```typescript
// Query Parameters
interface ExportQuery {
  category?: string
  status?: string
  format?: 'csv' | 'xlsx'
}

// Response: File download
```

### 2.3 Category Management

#### GET /api/v1/admin/categories
**Purpose**: Get all categories for admin management
```typescript
// Response: Complete category tree with admin metadata
interface AdminCategoryResponse {
  categories: Array<{
    id: string
    name: string
    slug: string
    description?: string
    parentId?: string
    sortOrder: number
    isActive: boolean
    productCount: number
    createdAt: string
    updatedAt: string
    children?: AdminCategoryResponse['categories']
  }>
}
```

#### POST /api/v1/admin/categories
**Purpose**: Create new category
```typescript
// Request Body
interface CreateCategoryRequest {
  name: string
  slug?: string
  description?: string
  parentId?: string
  sortOrder?: number
  isActive?: boolean
  image?: string
  metaTitle?: string
  metaDescription?: string
  translations?: Record<string, {
    name: string
    description?: string
    metaTitle?: string
    metaDescription?: string
  }>
}
```

#### PUT /api/v1/admin/categories/[id]
**Purpose**: Update category
```typescript
// Request Body: Same as CreateCategoryRequest (all optional)
```

#### DELETE /api/v1/admin/categories/[id]
**Purpose**: Delete category (cascade delete products)
```typescript
// Query Parameters
interface DeleteCategoryQuery {
  force?: boolean  // If true, delete even with products
}
```

#### POST /api/v1/admin/categories/reorder
**Purpose**: Reorder categories
```typescript
// Request Body
interface ReorderRequest {
  items: Array<{
    id: string
    sortOrder: number
    parentId?: string
  }>
}
```

### 2.4 RFP Management

#### GET /api/v1/admin/rfp
**Purpose**: Get RFP dashboard data
```typescript
// Query Parameters
interface AdminRFPQuery {
  status?: string
  urgency?: string
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

// Response
interface AdminRFPResponse {
  requests: Array<{
    id: string
    referenceNumber: string
    status: string
    customerName: string
    customerEmail: string
    companyName?: string
    urgencyLevel: string
    itemCount: number
    totalQuantity: number
    quoteAmount?: number
    assignedTo?: string
    createdAt: string
    updatedAt: string
  }>
  pagination: PaginationInfo
  summary: {
    totalRequests: number
    pendingRequests: number
    quotedRequests: number
    averageResponseTime: number
  }
}
```

#### GET /api/v1/admin/rfp/[id]
**Purpose**: Get detailed RFP information
```typescript
// Response
interface AdminRFPDetailResponse {
  // ... all RFP fields ...
  items: Array<{
    id: string
    product: {
      id: string
      name: string
      sku: string
      primaryImage?: string
    }
    quantity: number
    specialRequirements?: string
    quotedPrice?: number
  }>
  history: Array<{
    action: string
    user: string
    timestamp: string
    notes?: string
  }>
}
```

#### PUT /api/v1/admin/rfp/[id]
**Purpose**: Update RFP status and details
```typescript
// Request Body
interface UpdateRFPRequest {
  status?: string
  assignedTo?: string
  notes?: string
  quoteAmount?: number
  quoteValidUntil?: string
  itemQuotes?: Array<{
    itemId: string
    quotedPrice: number
  }>
}
```

#### POST /api/v1/admin/rfp/[id]/export
**Purpose**: Export RFP details
```typescript
// Query Parameters
interface RFPExportQuery {
  format: 'pdf' | 'excel'
  includeQuote?: boolean
}

// Response: File download
```

### 2.5 Partner Management

#### GET /api/v1/admin/partners
**Purpose**: Get partners for admin management
```typescript
// Query Parameters
interface AdminPartnerQuery {
  status?: 'active' | 'inactive' | 'all'
  featured?: boolean
  page?: number
  limit?: number
}
```

#### POST /api/v1/admin/partners
**Purpose**: Create new partner
```typescript
// Request Body
interface CreatePartnerRequest {
  name: string
  slug?: string
  description?: string
  websiteUrl?: string
  logoUrl?: string
  isFeatured?: boolean
  status?: 'active' | 'inactive'
  translations?: Record<string, {
    name: string
    description?: string
  }>
}
```

### 2.6 Content Management

#### POST /api/v1/admin/banners
**Purpose**: Create banner
```typescript
// Request Body
interface CreateBannerRequest {
  title: string
  subtitle?: string
  imageUrl?: string
  ctaText?: string
  ctaUrl?: string
  position: string
  isActive?: boolean
  startDate?: string
  endDate?: string
  translations?: Record<string, {
    title: string
    subtitle?: string
    ctaText?: string
  }>
}
```

#### GET /api/v1/admin/analytics
**Purpose**: Get dashboard analytics
```typescript
// Response
interface AnalyticsResponse {
  overview: {
    totalProducts: number
    totalCategories: number
    totalRFPs: number
    totalPartners: number
  }
  rfpTrends: Array<{
    date: string
    count: number
  }>
  popularCategories: Array<{
    categoryName: string
    viewCount: number
  }>
  recentActivity: Array<{
    action: string
    resource: string
    user: string
    timestamp: string
  }>
}
```

## 3. FILE UPLOAD ENDPOINTS

#### POST /api/v1/upload
**Purpose**: Upload files (images, documents)
```typescript
// Content-Type: multipart/form-data
// Form fields: file, type (optional)

// Response
interface UploadResponse {
  url: string
  filename: string
  size: number
  type: string
}
```

#### DELETE /api/v1/upload
**Purpose**: Delete uploaded file
```typescript
// Request Body
interface DeleteFileRequest {
  url: string
}
```

## 4. ERROR HANDLING

### Standard Error Responses
```typescript
interface ApiError {
  success: false
  error: string
  message: string
  code?: string
  details?: Record<string, any>
}

// Common HTTP Status Codes:
// 400 - Bad Request (validation errors)
// 401 - Unauthorized (missing/invalid token)
// 403 - Forbidden (insufficient permissions)
// 404 - Not Found
// 422 - Unprocessable Entity (business logic errors)
// 429 - Too Many Requests (rate limiting)
// 500 - Internal Server Error
```

### Validation Error Format
```typescript
interface ValidationError extends ApiError {
  details: {
    field: string
    message: string
    code: string
  }[]
}
```

## 5. RATE LIMITING & CACHING

### Rate Limits
- **Public API**: 100 requests/minute per IP
- **Admin API**: 500 requests/minute per user
- **Upload API**: 10 requests/minute per user

### Cache Headers
- **Product listings**: 5 minutes
- **Product details**: 15 minutes
- **Categories**: 30 minutes
- **Static content**: 1 hour

### Cache Invalidation
- Product changes → Clear product + category caches
- Category changes → Clear category + navigation caches
- Content changes → Clear content caches