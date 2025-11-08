# KITMED Security Framework

## Medical Industry Compliance & Security

### Regulatory Compliance Framework

#### GDPR Compliance (EU Medical Device Regulation)
```typescript
// lib/gdpr/consent.ts
export interface ConsentData {
  necessary: boolean      // Required for basic functionality
  analytics: boolean      // Google Analytics, usage tracking
  marketing: boolean      // Email marketing, promotional content
  functional: boolean     // Enhanced features, preferences
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

export class ConsentManager {
  static CONSENT_COOKIE = 'kitmed_consent'
  static CONSENT_VERSION = '1.0'
  
  static setConsent(consent: Partial<ConsentData>) {
    const consentData: ConsentData = {
      necessary: true, // Always required
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date(),
      ...consent
    }
    
    // Store consent with version and timestamp
    const consentString = JSON.stringify({
      version: this.CONSENT_VERSION,
      data: consentData
    })
    
    document.cookie = `${this.CONSENT_COOKIE}=${consentString}; Max-Age=31536000; Secure; SameSite=Strict`
    
    // Initialize analytics based on consent
    if (consentData.analytics) {
      this.initializeAnalytics()
    }
  }
  
  static getConsent(): ConsentData | null {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${this.CONSENT_COOKIE}=`))
    
    if (!cookie) return null
    
    try {
      const consentInfo = JSON.parse(cookie.split('=')[1])
      return consentInfo.data
    } catch {
      return null
    }
  }
}
```

#### Data Protection & Privacy
```typescript
// lib/privacy/data-protection.ts
export class DataProtectionService {
  // Personal data encryption for RFP submissions
  static async encryptPersonalData(data: Record<string, any>): Promise<string> {
    const encoder = new TextEncoder()
    const dataString = JSON.stringify(data)
    const dataBuffer = encoder.encode(dataString)
    
    const key = await crypto.subtle.importKey(
      'raw',
      Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    )
    
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    )
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    return Buffer.from(combined).toString('base64')
  }
  
  static async decryptPersonalData(encryptedData: string): Promise<Record<string, any>> {
    const combined = Buffer.from(encryptedData, 'base64')
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    
    const key = await crypto.subtle.importKey(
      'raw',
      Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )
    
    const decoder = new TextDecoder()
    return JSON.parse(decoder.decode(decrypted))
  }
  
  // Data anonymization for analytics
  static anonymizeRFPData(rfp: any) {
    return {
      id: rfp.id,
      itemCount: rfp.items.length,
      totalValue: rfp.totalValue,
      submissionDate: rfp.createdAt,
      // Remove all personal identifiers
      companySize: this.categorizeCompanySize(rfp.companyName),
      region: this.categorizeRegion(rfp.contactEmail),
    }
  }
}
```

### Authentication & Authorization

#### Multi-Factor Authentication (MFA)
```typescript
// lib/auth/mfa.ts
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export class MFAService {
  static generateSecret(userEmail: string): string {
    return authenticator.generateSecret()
  }
  
  static async generateQRCode(secret: string, userEmail: string): Promise<string> {
    const service = 'KITMED Admin'
    const otpauth = authenticator.keyuri(userEmail, service, secret)
    return await QRCode.toDataURL(otpauth)
  }
  
  static verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret })
    } catch {
      return false
    }
  }
  
  static generateBackupCodes(): string[] {
    const codes = []
    for (let i = 0; i < 10; i++) {
      codes.push(
        Math.random().toString(36).substring(2, 8).toUpperCase() +
        '-' +
        Math.random().toString(36).substring(2, 8).toUpperCase()
      )
    }
    return codes
  }
}

// Database schema addition for MFA
/*
ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN backup_codes JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN last_mfa_verification TIMESTAMP;
*/
```

#### Role-Based Access Control (RBAC)
```typescript
// lib/auth/rbac.ts
export enum Permission {
  // Product management
  PRODUCT_READ = 'product:read',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  PRODUCT_BULK_IMPORT = 'product:bulk_import',
  
  // Category management
  CATEGORY_READ = 'category:read',
  CATEGORY_CREATE = 'category:create',
  CATEGORY_UPDATE = 'category:update',
  CATEGORY_DELETE = 'category:delete',
  
  // RFP management
  RFP_READ = 'rfp:read',
  RFP_UPDATE = 'rfp:update',
  RFP_DELETE = 'rfp:delete',
  RFP_ASSIGN = 'rfp:assign',
  
  // User management
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // System administration
  SYSTEM_SETTINGS = 'system:settings',
  AUDIT_LOGS = 'audit:read',
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: Object.values(Permission),
  admin: [
    Permission.PRODUCT_READ,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,
    Permission.PRODUCT_BULK_IMPORT,
    Permission.CATEGORY_READ,
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_UPDATE,
    Permission.CATEGORY_DELETE,
    Permission.RFP_READ,
    Permission.RFP_UPDATE,
    Permission.RFP_ASSIGN,
  ],
  editor: [
    Permission.PRODUCT_READ,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.CATEGORY_READ,
    Permission.RFP_READ,
  ],
  viewer: [
    Permission.PRODUCT_READ,
    Permission.CATEGORY_READ,
    Permission.RFP_READ,
  ],
}

export function hasPermission(userRole: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.includes(permission)
}

export function requirePermission(permission: Permission) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.role || !hasPermission(session.user.role, permission)) {
        throw new Error('Insufficient permissions')
      }
      
      return method.apply(this, args)
    }
  }
}

// Usage example
export class ProductService {
  @requirePermission(Permission.PRODUCT_CREATE)
  async createProduct(data: CreateProductData) {
    // Implementation
  }
  
  @requirePermission(Permission.PRODUCT_DELETE)
  async deleteProduct(id: string) {
    // Implementation
  }
}
```

### Input Validation & Sanitization

#### Comprehensive Input Validation
```typescript
// lib/validation/security.ts
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// Custom validation schemas with security considerations
export const secureTextSchema = z
  .string()
  .min(1)
  .max(1000)
  .refine(
    (val) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val),
    'Script tags not allowed'
  )
  .transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }))

export const secureRichTextSchema = z
  .string()
  .max(10000)
  .transform((val) => 
    DOMPurify.sanitize(val, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
      ALLOWED_ATTR: []
    })
  )

export const sqlInjectionSafeSchema = z
  .string()
  .refine(
    (val) => !/(['";]|--|\bdrop\b|\bdelete\b|\btruncate\b)/gi.test(val),
    'Invalid characters detected'
  )

export const emailSchema = z
  .string()
  .email()
  .refine((email) => validator.isEmail(email), 'Invalid email format')
  .transform((email) => validator.normalizeEmail(email) || email)

export const phoneSchema = z
  .string()
  .refine((phone) => validator.isMobilePhone(phone, 'any'), 'Invalid phone number')

export const fileUploadSchema = z.object({
  name: z.string().refine(
    (name) => !/[<>:"/\\|?*]/.test(name),
    'Invalid filename characters'
  ),
  type: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
})

// RFP form validation with security
export const createRFPSchema = z.object({
  companyName: secureTextSchema.max(255),
  contactName: secureTextSchema.max(255),
  contactEmail: emailSchema,
  contactPhone: phoneSchema.optional(),
  message: secureRichTextSchema.optional(),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().min(1).max(10000),
      specifications: secureTextSchema.optional(),
    })
  ).min(1).max(50), // Limit RFP items
})
```

#### File Upload Security
```typescript
// lib/security/file-upload.ts
import { createHash } from 'crypto'
import sharp from 'sharp'

export class SecureFileUpload {
  private static readonly ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ])
  
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  
  static async validateFile(file: File): Promise<{ isValid: boolean; error?: string }> {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { isValid: false, error: 'File size exceeds limit' }
    }
    
    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.has(file.type)) {
      return { isValid: false, error: 'File type not allowed' }
    }
    
    // Verify actual file content matches MIME type
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    
    if (!this.verifyFileSignature(uint8Array, file.type)) {
      return { isValid: false, error: 'File content does not match declared type' }
    }
    
    return { isValid: true }
  }
  
  private static verifyFileSignature(buffer: Uint8Array, mimeType: string): boolean {
    const signatures: Record<string, number[][]> = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
    }
    
    const expectedSignatures = signatures[mimeType]
    if (!expectedSignatures) return false
    
    return expectedSignatures.some(signature =>
      signature.every((byte, index) => buffer[index] === byte)
    )
  }
  
  static async processImage(file: File): Promise<Buffer> {
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Strip metadata and resize if needed
    return await sharp(buffer)
      .resize(1920, 1080, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: 85,
        strip: true // Remove EXIF data
      })
      .toBuffer()
  }
  
  static generateSecureFilename(originalName: string, userId?: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const extension = originalName.split('.').pop()?.toLowerCase() || ''
    
    const hash = createHash('sha256')
      .update(`${originalName}${timestamp}${random}${userId || ''}`)
      .digest('hex')
      .substring(0, 16)
    
    return `${timestamp}_${hash}.${extension}`
  }
}
```

### API Security

#### Rate Limiting & DDoS Protection
```typescript
// lib/security/rate-limiting.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Different rate limits for different endpoints
export const rateLimits = {
  // Public API endpoints
  public: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 h"), // 100 requests per hour
    analytics: true,
  }),
  
  // Search endpoint (more generous for UX)
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, "1 h"),
    analytics: true,
  }),
  
  // RFP submission (strict to prevent spam)
  rfpSubmission: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 RFPs per hour
    analytics: true,
  }),
  
  // Admin API (more generous for authenticated users)
  admin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(500, "1 h"),
    analytics: true,
  }),
  
  // File upload (very strict)
  fileUpload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"), // 20 uploads per hour
    analytics: true,
  }),
}

export async function applyRateLimit(
  request: Request,
  limitType: keyof typeof rateLimits
): Promise<{ success: boolean; remaining?: number }> {
  const ip = request.headers.get("x-forwarded-for") ?? 
           request.headers.get("x-real-ip") ?? 
           "127.0.0.1"
  
  const { success, limit, remaining, reset } = await rateLimits[limitType].limit(ip)
  
  if (!success) {
    throw new Response(
      JSON.stringify({
        error: "Too many requests",
        retryAfter: reset,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": reset.toString(),
        },
      }
    )
  }
  
  return { success, remaining }
}
```

#### SQL Injection Prevention
```typescript
// lib/security/database.ts
import { PrismaClient, Prisma } from '@prisma/client'

export class SecureDatabase {
  private prisma: PrismaClient
  
  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
      ],
    })
    
    // Monitor for potential SQL injection attempts
    this.prisma.$on('query', (e) => {
      const suspiciousPatterns = [
        /union\s+select/i,
        /;\s*drop\s+table/i,
        /;\s*delete\s+from/i,
        /information_schema/i,
        /pg_catalog/i,
      ]
      
      const isSuspicious = suspiciousPatterns.some(pattern => 
        pattern.test(e.query)
      )
      
      if (isSuspicious) {
        console.error('Suspicious query detected:', {
          query: e.query,
          params: e.params,
          timestamp: new Date().toISOString(),
        })
        
        // Alert security team
        this.alertSecurityTeam('SQL injection attempt detected', {
          query: e.query,
          params: e.params,
        })
      }
    })
  }
  
  // Safe raw query execution with parameter validation
  async executeRawQuery<T>(
    sql: TemplateStringsArray,
    ...values: any[]
  ): Promise<T[]> {
    // Validate all parameters
    for (const value of values) {
      if (typeof value === 'string' && this.containsSqlInjection(value)) {
        throw new Error('Invalid parameter detected')
      }
    }
    
    return this.prisma.$queryRaw<T[]>(sql, ...values)
  }
  
  private containsSqlInjection(input: string): boolean {
    const patterns = [
      /(['";]|--|\bdrop\b|\bdelete\b|\btruncate\b|\bunion\b)/gi,
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ]
    
    return patterns.some(pattern => pattern.test(input))
  }
  
  private async alertSecurityTeam(message: string, data: any) {
    // Implementation would send alert to security monitoring system
    // Could integrate with services like Sentry, DataDog, etc.
    console.error('SECURITY ALERT:', message, data)
  }
}
```

### Audit Trail & Monitoring

#### Comprehensive Audit Logging
```typescript
// lib/security/audit.ts
export interface AuditLogEntry {
  id: string
  userId?: string
  sessionId?: string
  action: string
  entityType: string
  entityId: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  risk_level: 'low' | 'medium' | 'high' | 'critical'
}

export class AuditLogger {
  private static async createLogEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const auditEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...entry,
    }
    
    // Store in database
    await db.auditLog.create({
      data: auditEntry,
    })
    
    // Send to external monitoring if critical
    if (entry.risk_level === 'critical') {
      await this.sendSecurityAlert(auditEntry)
    }
  }
  
  static async logUserAction(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    changes?: { old?: any; new?: any },
    context?: { ip?: string; userAgent?: string }
  ) {
    await this.createLogEntry({
      userId,
      action,
      entityType,
      entityId,
      oldValues: changes?.old,
      newValues: changes?.new,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      risk_level: this.assessRiskLevel(action, entityType),
    })
  }
  
  static async logSecurityEvent(
    event: string,
    details: Record<string, any>,
    context?: { ip?: string; userAgent?: string; userId?: string }
  ) {
    await this.createLogEntry({
      userId: context?.userId,
      action: event,
      entityType: 'security_event',
      entityId: crypto.randomUUID(),
      newValues: details,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      risk_level: 'critical',
    })
  }
  
  private static assessRiskLevel(action: string, entityType: string): AuditLogEntry['risk_level'] {
    const highRiskActions = ['delete', 'bulk_import', 'permission_change']
    const criticalEntities = ['user', 'system_settings']
    
    if (highRiskActions.includes(action) || criticalEntities.includes(entityType)) {
      return 'high'
    }
    
    if (action.includes('create') || action.includes('update')) {
      return 'medium'
    }
    
    return 'low'
  }
  
  private static async sendSecurityAlert(entry: AuditLogEntry) {
    // Integration with security monitoring services
    // Example: Sentry, Slack, email alerts, etc.
    console.error('CRITICAL SECURITY EVENT:', entry)
  }
}

// Usage in server actions
export async function updateProduct(id: string, data: any) {
  const session = await getServerSession(authOptions)
  const oldProduct = await db.product.findUnique({ where: { id } })
  
  const updatedProduct = await db.product.update({
    where: { id },
    data,
  })
  
  // Log the action
  await AuditLogger.logUserAction(
    session!.user.id,
    'update',
    'product',
    id,
    { old: oldProduct, new: updatedProduct }
  )
  
  return updatedProduct
}
```

### Environment Security

#### Secure Environment Configuration
```bash
# .env.example - Template for environment variables
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kitmed_dev"
DIRECT_URL="postgresql://user:password@localhost:5432/kitmed_dev"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Encryption
ENCRYPTION_KEY="64-character-hex-key-for-aes-256-encryption"

# Rate Limiting
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# File Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET="kitmed-files"
CLOUDFRONT_URL="https://your-cloudfront-domain.com"

# Email
RESEND_API_KEY="your-resend-api-key"
SMTP_FROM="noreply@kitmed.com"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
```

#### Security Headers Configuration
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
    ].join('; ')
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```