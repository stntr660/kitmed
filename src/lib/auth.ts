import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AdminUser, AdminPermission, AdminResource, AdminAction } from '@/types/admin';

// Use centralized JWT_SECRET validation
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for production');
}
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12;

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// JWT utilities
export const generateToken = (user: AdminUser): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
    JWT_SECRET,
    {
      expiresIn: '24h',
      issuer: 'kitmed-admin',
      audience: 'kitmed-admin-panel',
    }
  );
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Authentication middleware
export const authenticate = async (request: NextRequest): Promise<AdminUser | null> => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('admin-token')?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    
    // In a real implementation, you'd fetch the user from the database
    // For now, we'll return the decoded token data
    return {
      id: decoded.userId,
      email: decoded.email,
      firstName: '',
      lastName: '',
      role: decoded.role,
      isActive: true,
      permissions: decoded.permissions || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      loginHistory: [],
    };
  } catch (error) {
    return null;
  }
};

// Permission checking
export const hasPermission = (
  user: AdminUser,
  resource: AdminResource,
  action: AdminAction
): boolean => {
  // Admin role has all permissions (case-insensitive check)
  if (user.role?.toLowerCase() === 'admin') {
    return true;
  }

  // Check specific permissions
  const permission = user.permissions.find(p => p.resource === resource);
  return permission ? permission.actions.includes(action) : false;
};

// Role-based access control
export const requireRole = (allowedRoles: string[]) => {
  return (user: AdminUser | null): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };
};

// Permission middleware for API routes
export const withAuth = (
  handler: Function,
  options: {
    resource?: AdminResource;
    action?: AdminAction;
    roles?: string[];
  } = {}
) => {
  return async (request: NextRequest, context: any) => {
    const user = await authenticate(request);

    if (!user) {
      return Response.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check role if specified (case-insensitive)
    if (options.roles && !options.roles.map(r => r.toLowerCase()).includes(user.role?.toLowerCase())) {
      return Response.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Check resource permission if specified
    if (options.resource && options.action) {
      if (!hasPermission(user, options.resource, options.action)) {
        return Response.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
          { status: 403 }
        );
      }
    }

    // Add user to request context
    (request as any).user = user;

    return handler(request, context);
  };
};

// Default permissions by role
export const getDefaultPermissions = (role: string): AdminPermission[] => {
  switch (role) {
    case 'admin':
      return [
        { resource: 'products', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { resource: 'categories', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { resource: 'partners', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
        { resource: 'rfp_requests', actions: ['create', 'read', 'update', 'delete', 'export'] },
        { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'export'] },
        { resource: 'content', actions: ['create', 'read', 'update', 'delete', 'export'] },
        { resource: 'analytics', actions: ['read', 'export'] },
        { resource: 'settings', actions: ['read', 'update'] },
      ];
    
    case 'editor':
      return [
        { resource: 'products', actions: ['create', 'read', 'update', 'export'] },
        { resource: 'categories', actions: ['read', 'update'] },
        { resource: 'partners', actions: ['create', 'read', 'update'] },
        { resource: 'rfp_requests', actions: ['read', 'update', 'export'] },
        { resource: 'content', actions: ['create', 'read', 'update'] },
        { resource: 'analytics', actions: ['read'] },
      ];
    
    default:
      return [];
  }
};

// Session management
export const createSession = async (user: AdminUser): Promise<string> => {
  const token = generateToken(user);
  
  // In a real implementation, you'd store session in database
  // For now, we'll just return the token
  return token;
};

export const destroySession = async (token: string): Promise<void> => {
  // In a real implementation, you'd remove session from database
  // or add token to blacklist
};

// Audit logging
export const logActivity = async (
  user: AdminUser,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>,
  request?: NextRequest
): Promise<void> => {
  const activityLog = {
    userId: user.id,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress: request?.ip || 'unknown',
    userAgent: request?.headers.get('user-agent') || 'unknown',
    createdAt: new Date(),
  };

  // In a real implementation, you'd save this to the database
  // TODO: Implement proper audit logging to database
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Rate limiting (simple in-memory implementation)
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export const checkRateLimit = (identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean => {
  const now = new Date();
  const attempts = loginAttempts.get(identifier);

  if (!attempts) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset if window has passed
  if (now.getTime() - attempts.lastAttempt.getTime() > windowMs) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }

  // Check if limit exceeded
  if (attempts.count >= maxAttempts) {
    return false;
  }

  // Increment attempts
  attempts.count++;
  attempts.lastAttempt = now;
  loginAttempts.set(identifier, attempts);

  return true;
};