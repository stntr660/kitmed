# KITMED API Structure

## API Design Philosophy
- **Public APIs**: REST for external consumption and SEO
- **Internal APIs**: Server Actions for form submissions and mutations
- **Real-time**: Server-Sent Events for RFP notifications

## Public REST API Routes

### Product Catalog (Read-only, SEO-friendly)
```
GET /api/disciplines
GET /api/disciplines/[slug]
GET /api/disciplines/[discipline]/categories
GET /api/categories/[slug]
GET /api/categories/[category]/products
GET /api/products/[sku]
GET /api/products/search?q=term&category=&discipline=&page=1
GET /api/companies/[slug]
```

### RFP System
```
POST /api/rfp - Create new RFP
GET /api/rfp/[reference] - Public RFP status check
```

## Admin API Routes (Protected)

### Content Management
```
GET /api/admin/products
POST /api/admin/products
PUT /api/admin/products/[id]
DELETE /api/admin/products/[id]
POST /api/admin/products/bulk-import - CSV import

GET /api/admin/categories
POST /api/admin/categories
PUT /api/admin/categories/[id]
DELETE /api/admin/categories/[id]

GET /api/admin/disciplines
POST /api/admin/disciplines
PUT /api/admin/disciplines/[id]
DELETE /api/admin/disciplines/[id]
```

### RFP Management
```
GET /api/admin/rfps?status=&priority=&page=1
PUT /api/admin/rfps/[id] - Update status, assign, add notes
DELETE /api/admin/rfps/[id]
GET /api/admin/rfps/[id]/export - Export RFP details
```

### File Management
```
POST /api/admin/upload - Multi-file upload
DELETE /api/admin/files/[path] - Remove file
```

## Server Actions (Form Handling)

### Public Actions
```typescript
// app/actions/rfp.ts
export async function createRFP(formData: FormData)
export async function addToRFPCart(productId: string)
export async function removeFromRFPCart(productId: string)
```

### Admin Actions
```typescript
// app/admin/actions/products.ts
export async function createProduct(formData: FormData)
export async function updateProduct(id: string, formData: FormData)
export async function deleteProduct(id: string)
export async function bulkImportProducts(csvData: File)

// app/admin/actions/rfp.ts
export async function updateRFPStatus(rfpId: string, status: string)
export async function assignRFP(rfpId: string, userId: string)
```

## Authentication Strategy

### NextAuth.js Configuration
```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validate against users table
        const user = await validateUser(credentials?.email, credentials?.password)
        return user || null
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      session.user.id = token.userId
      return session
    }
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/error',
  }
}
```

### Route Protection
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protect admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('next-auth.session-token')
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  
  // API route protection
  if (pathname.startsWith('/api/admin')) {
    return protectAPIRoute(request)
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}
```

## Rate Limiting & Security

### API Rate Limiting
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
  analytics: true,
})

// Usage in API routes
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response("Too Many Requests", { status: 429 })
  }
  
  // Process request...
}
```

### Input Validation
```typescript
// lib/validation.ts
import { z } from "zod"

export const createProductSchema = z.object({
  name_fr: z.string().min(1).max(255),
  name_en: z.string().max(255).optional(),
  category_id: z.number().int().positive(),
  sku: z.string().min(1).max(100),
  description_fr: z.string().optional(),
  description_en: z.string().optional(),
})

export const createRFPSchema = z.object({
  company_name: z.string().min(1).max(255),
  contact_name: z.string().min(1).max(255),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
  message: z.string().optional(),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    quantity: z.number().int().positive().default(1),
    specifications: z.string().optional(),
  })).min(1),
})
```