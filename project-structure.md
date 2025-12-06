# KITMED Project Structure

## Domain-Driven Directory Structure

```
kitmed/
├── app/                          # Next.js 14 App Router
│   ├── (public)/                # Public routes group
│   │   ├── page.tsx             # Homepage
│   │   ├── products/            # Product catalog
│   │   │   ├── page.tsx         # Products overview
│   │   │   ├── [discipline]/    # Discipline pages
│   │   │   │   ├── page.tsx
│   │   │   │   └── [category]/  # Category pages
│   │   │   │       ├── page.tsx
│   │   │   │       └── [sku]/   # Product detail
│   │   │   │           └── page.tsx
│   │   │   └── search/          # Product search
│   │   │       └── page.tsx
│   │   ├── companies/           # Company/Partner pages
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── rfp/                 # RFP workflow
│   │   │   ├── page.tsx         # RFP form
│   │   │   ├── cart/            # RFP cart
│   │   │   │   └── page.tsx
│   │   │   └── [reference]/     # RFP status
│   │   │       └── page.tsx
│   │   └── layout.tsx           # Public layout
│   │
│   ├── admin/                   # Admin panel
│   │   ├── layout.tsx           # Admin layout
│   │   ├── page.tsx             # Admin dashboard
│   │   ├── login/               # Admin authentication
│   │   │   └── page.tsx
│   │   ├── products/            # Product management
│   │   │   ├── page.tsx         # Product list
│   │   │   ├── new/             # Create product
│   │   │   │   └── page.tsx
│   │   │   ├── import/          # Bulk import
│   │   │   │   └── page.tsx
│   │   │   └── [id]/            # Edit product
│   │   │       └── page.tsx
│   │   ├── categories/          # Category management
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── disciplines/         # Discipline management
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── companies/           # Company management
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── rfps/               # RFP management
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── banners/            # Banner management
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── users/              # User management
│   │       ├── page.tsx
│   │       ├── new/
│   │       │   └── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   │
│   ├── api/                    # API routes
│   │   ├── disciplines/        # Public API
│   │   │   ├── route.ts
│   │   │   └── [slug]/
│   │   │       └── route.ts
│   │   ├── categories/
│   │   │   ├── route.ts
│   │   │   └── [slug]/
│   │   │       └── route.ts
│   │   ├── products/
│   │   │   ├── route.ts
│   │   │   ├── search/
│   │   │   │   └── route.ts
│   │   │   └── [sku]/
│   │   │       └── route.ts
│   │   ├── companies/
│   │   │   ├── route.ts
│   │   │   └── [slug]/
│   │   │       └── route.ts
│   │   ├── rfp/
│   │   │   ├── route.ts
│   │   │   └── [reference]/
│   │   │       └── route.ts
│   │   ├── admin/              # Protected admin API
│   │   │   ├── products/
│   │   │   │   ├── route.ts
│   │   │   │   ├── bulk-import/
│   │   │   │   │   └── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── categories/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── rfps/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   └── upload/
│   │   │       └── route.ts
│   │   └── auth/               # NextAuth routes
│   │       └── [...nextauth]/
│   │           └── route.ts
│   │
│   ├── actions/                # Server Actions
│   │   ├── public/             # Public actions
│   │   │   └── rfp.ts
│   │   └── admin/              # Admin actions
│   │       ├── products.ts
│   │       ├── categories.ts
│   │       ├── rfps.ts
│   │       └── companies.ts
│   │
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   ├── loading.tsx             # Global loading UI
│   ├── error.tsx               # Global error UI
│   └── not-found.tsx           # 404 page
│
├── lib/                        # Core business logic
│   ├── domains/                # Domain modules
│   │   ├── products/
│   │   │   ├── types.ts        # Product domain types
│   │   │   ├── service.ts      # Product business logic
│   │   │   ├── repository.ts   # Product data access
│   │   │   └── validation.ts   # Product validation schemas
│   │   ├── categories/
│   │   │   ├── types.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   └── validation.ts
│   │   ├── rfp/
│   │   │   ├── types.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   └── validation.ts
│   │   ├── companies/
│   │   │   ├── types.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   └── validation.ts
│   │   └── users/
│   │       ├── types.ts
│   │       ├── service.ts
│   │       ├── repository.ts
│   │       └── validation.ts
│   │
│   ├── shared/                 # Shared utilities
│   │   ├── database.ts         # Database connection
│   │   ├── auth.ts            # Authentication config
│   │   ├── storage.ts         # File storage utilities
│   │   ├── email.ts           # Email service
│   │   ├── cache.ts           # Caching utilities
│   │   ├── validation.ts      # Common validation
│   │   ├── utils.ts           # General utilities
│   │   ├── constants.ts       # App constants
│   │   └── types.ts           # Shared types
│   │
│   └── hooks/                  # Custom React hooks
│       ├── use-rfp-cart.ts
│       ├── use-search.ts
│       ├── use-pagination.ts
│       └── use-language.ts
│
├── components/                 # Reusable UI components
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   ├── layout/                # Layout components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── navigation.tsx
│   │   ├── sidebar.tsx
│   │   └── admin-layout.tsx
│   │
│   ├── features/              # Feature-specific components
│   │   ├── product-catalog/
│   │   │   ├── product-card.tsx
│   │   │   ├── product-grid.tsx
│   │   │   ├── product-filters.tsx
│   │   │   ├── product-search.tsx
│   │   │   └── category-nav.tsx
│   │   ├── rfp/
│   │   │   ├── rfp-form.tsx
│   │   │   ├── rfp-cart.tsx
│   │   │   ├── rfp-item.tsx
│   │   │   └── rfp-status.tsx
│   │   └── admin/
│   │       ├── data-table.tsx
│   │       ├── upload-zone.tsx
│   │       ├── bulk-import.tsx
│   │       └── status-badge.tsx
│   │
│   └── common/                # Common components
│       ├── language-switcher.tsx
│       ├── breadcrumbs.tsx
│       ├── pagination.tsx
│       ├── loading-spinner.tsx
│       ├── error-boundary.tsx
│       └── seo-head.tsx
│
├── public/                    # Static assets
│   ├── images/
│   │   ├── logos/
│   │   ├── products/
│   │   └── banners/
│   ├── documents/
│   └── favicon.ico
│
├── prisma/                    # Database configuration
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── messages/                  # Internationalization
│   ├── fr.json
│   └── en.json
│
├── tests/                     # Test files
│   ├── __mocks__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/                      # Documentation
│   ├── deployment.md
│   ├── api.md
│   └── contributing.md
│
├── .env.local                 # Environment variables
├── .env.example
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
├── package.json
└── README.md
```

## Key Architectural Principles

### 1. Domain-Driven Design
- Each domain (products, rfp, companies) has its own module
- Clear separation between types, services, repositories, and validation
- Business logic isolated from framework concerns

### 2. Clean Architecture Layers
- **Presentation**: React components and Next.js pages
- **Application**: Server Actions and API routes
- **Business**: Domain services and validation
- **Infrastructure**: Database, file storage, external APIs

### 3. Dependency Flow
```
Components → Actions/APIs → Services → Repositories → Database
```

### 4. Feature Organization
- Features grouped by business capability
- Shared components in common directory
- UI components following atomic design principles

### 5. Configuration Management
- Environment-specific configurations
- Type-safe environment variables
- Clear separation of secrets and public config