/**
 * Authentication utilities with hydration-safe localStorage access
 */
import { safeLocalStorage } from '@/lib/hydration-utils';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

/**
 * Get admin auth token safely
 */
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const storage = safeLocalStorage();
  
  // In development, use localStorage first (HTTP-only cookies not accessible to JS)
  if (process.env.NODE_ENV === 'development') {
    return storage.getItem('admin-token');
  }
  
  // In production, try cookies first, then localStorage as fallback
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => 
      cookie.trim().startsWith('admin-token=')
    );
    
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }
  
  // Fallback to localStorage
  return storage.getItem('admin-token');
}

/**
 * Set admin auth token safely
 */
export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  const storage = safeLocalStorage();
  storage.setItem('admin-token', token);
}

/**
 * Remove admin auth token safely
 */
export function removeAdminToken(): void {
  if (typeof window === 'undefined') return;
  
  const storage = safeLocalStorage();
  
  // Remove cookie (only in browser)
  if (typeof document !== 'undefined') {
    document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
  }
  
  // Remove from localStorage
  storage.removeItem('admin-token');
}

/**
 * Get auth headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Create fetch options with auth headers
 */
export function createAuthFetchOptions(
  options: RequestInit = {}
): RequestInit {
  const authHeaders = getAuthHeaders();
  
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAdminToken();
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>();

/**
 * Server-side JWT verification
 */
export async function verifyRequestAuth(request: NextRequest): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'development-secret-key';
    
    const decoded = jwt.verify(token, secret) as any;
    
    return {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get admin user from environment
 */
export function getAdminUser() {
  return {
    id: process.env.ADMIN_USER_ID || 'admin-1',
    email: process.env.ADMIN_EMAIL || 'admin@kitmed.ma',
    firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
    lastName: process.env.ADMIN_LAST_NAME || 'User',
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
  };
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    return false;
  }
}

/**
 * Generate JWT token
 */
export function generateToken(user: { id: string; email: string; firstName: string; lastName: string; role: string }): string {
  const secret = process.env.JWT_SECRET || 'development-secret-key';
  
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    secret,
    { expiresIn: '24h' }
  );
}

/**
 * Check rate limit for IP address
 */
export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;
  
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { attempts: 0, resetTime: now + windowMs });
    return { allowed: true, remainingAttempts: maxAttempts };
  }
  
  if (record.attempts >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0 };
  }
  
  record.attempts++;
  return { allowed: true, remainingAttempts: maxAttempts - record.attempts };
}

/**
 * Reset rate limit for IP address
 */
export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}