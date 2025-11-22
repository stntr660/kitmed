import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-immediately';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'editor';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Hash password for storage
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

// Verify password against hash
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: AdminUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'kitmed-app',
    audience: 'kitmed-admin',
  });
}

// Verify and decode JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'kitmed-app',
      audience: 'kitmed-admin',
    }) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Extract token from request
export function extractTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const tokenFromCookie = request.cookies.get('admin-token')?.value;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  return null;
}

// Verify request authentication
export async function verifyRequestAuth(request: NextRequest): Promise<JWTPayload | null> {
  const token = extractTokenFromRequest(request);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

// Get admin user from environment (temporary solution)
export function getAdminUser(): AdminUser {
  return {
    id: '1',
    email: process.env.ADMIN_EMAIL || 'admin@kitmed.ma',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    status: 'ACTIVE',
  };
}

// Rate limiting utility
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Reset if lockout time has passed
  if (now - attempt.lastAttempt > LOCKOUT_TIME) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Check if max attempts reached
  if (attempt.count >= MAX_ATTEMPTS) {
    return { allowed: false, remainingAttempts: 0 };
  }

  // Increment attempt count
  attempt.count++;
  attempt.lastAttempt = now;
  
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - attempt.count };
}

export function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}