/**
 * Production Security Configuration
 * Implements comprehensive security measures for production deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from './env-validation';

const logger = getLogger();

/**
 * Rate limiting store (in-memory for demo, use Redis in production)
 */
const rateLimitStore = new Map<string, { requests: number; resetTime: number }>();

/**
 * Security headers for production
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // HTTPS enforcement
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    
    // Content Security Policy
    'Content-Security-Policy': 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self'; " +
      "font-src 'self'; " +
      "frame-src 'none'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'",
    
    // XSS Protection
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    'Permissions-Policy': 
      'camera=(), microphone=(), geolocation=(), payment=()',
    
    // Remove server information
    'Server': 'KITMED-Platform',
    
    // MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
  };
}

/**
 * Get allowed origins for CORS
 */
export function getAllowedOrigins(): string[] {
  if (process.env.NODE_ENV === 'production') {
    return [
      'https://kitmed.ma',
      'https://www.kitmed.ma',
      'https://admin.kitmed.ma',
    ];
  }
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];
}

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/admin/auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 login attempts per 15 minutes
  '/api/admin/auth': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 requests per minute for auth endpoints
  '/api/admin': { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute for admin APIs
  default: { windowMs: 60 * 1000, maxRequests: 200 }, // 200 requests per minute default
};

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(request: NextRequest): { allowed: boolean; remaining: number } {
  const ip = getClientIP(request);
  const path = new URL(request.url).pathname;
  
  // Find applicable rate limit
  let config = RATE_LIMITS.default;
  for (const [pattern, rateConfig] of Object.entries(RATE_LIMITS)) {
    if (pattern !== 'default' && path.startsWith(pattern)) {
      config = rateConfig;
      break;
    }
  }
  
  const key = `${ip}:${path}`;
  const now = Date.now();
  const store = rateLimitStore.get(key);
  
  // Initialize or reset if window expired
  if (!store || now > store.resetTime) {
    rateLimitStore.set(key, {
      requests: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }
  
  // Check if limit exceeded
  if (store.requests >= config.maxRequests) {
    logger.warn(`Rate limit exceeded for ${ip} on ${path}`, { ip, path, requests: store.requests });
    return { allowed: false, remaining: 0 };
  }
  
  // Increment counter
  store.requests++;
  rateLimitStore.set(key, store);
  
  return { allowed: true, remaining: config.maxRequests - store.requests };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIp) return cfConnectingIp;
  if (xRealIp) return xRealIp;
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  return 'unknown';
}

/**
 * Validate CORS origin
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Create CORS headers for response
 */
export function getCORSHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin!;
  } else if (process.env.NODE_ENV === 'development') {
    // More permissive in development
    headers['Access-Control-Allow-Origin'] = '*';
  }
  
  headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  headers['Access-Control-Allow-Credentials'] = 'true';
  headers['Access-Control-Max-Age'] = '86400'; // 24 hours
  
  return headers;
}

/**
 * Input sanitization
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate file upload security
 */
export function validateFileUpload(filename: string, mimeType: string): { valid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
  
  // Check MIME type
  if (!allowedTypes.includes(mimeType)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  // Check file extension
  const extension = filename.toLowerCase().split('.').pop();
  if (!extension || !allowedExtensions.includes(`.${extension}`)) {
    return { valid: false, error: 'File extension not allowed' };
  }
  
  // Check for potential malicious filenames
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { valid: false, error: 'Invalid filename' };
  }
  
  return { valid: true };
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Security middleware for API routes
 */
export function withSecurity(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const origin = request.headers.get('origin');
    
    // Apply rate limiting
    const rateLimit = applyRateLimit(request);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            ...getCORSHeaders(origin),
            ...getSecurityHeaders(),
          }
        }
      );
    }
    
    // Execute handler
    const response = await handler(request, context);
    
    // Add security headers to response
    const securityHeaders = getSecurityHeaders();
    const corsHeaders = getCORSHeaders(origin);
    
    Object.entries({ ...securityHeaders, ...corsHeaders }).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    
    return response;
  };
}