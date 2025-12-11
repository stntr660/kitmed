import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth, getAdminUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const auth = await verifyRequestAuth(request);

    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Try to get actual user from database first
    let userData = null;

    try {
      // Look up the actual user from database using the token's user ID
      const dbUser = await prisma.users.findUnique({
        where: { id: auth.userId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          last_login: true,
        },
      });

      if (dbUser && dbUser.is_active) {
        userData = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          role: dbUser.role,
          status: dbUser.is_active ? 'ACTIVE' : 'INACTIVE',
          lastLoginAt: dbUser.last_login?.toISOString() || new Date().toISOString(),
          createdAt: dbUser.created_at.toISOString(),
          updatedAt: dbUser.updated_at.toISOString(),
        };
      }
    } catch (dbError) {
      // Log to proper logging service in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Database user lookup failed:', dbError);
      }
    }

    // Fallback to environment admin user if database lookup fails
    if (!userData) {
      const adminUser = getAdminUser();
      userData = {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
        status: adminUser.status,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Define permissions based on role
    const getPermissionsByRole = (role: string) => {
      if (role === 'admin') {
        return [
          { resource: 'admin', actions: ['read', 'write'] },
          { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'rfp_requests', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'settings', actions: ['read', 'update'] },
          { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'analytics', actions: ['read'] },
          { resource: 'categories', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'partners', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'content', actions: ['create', 'read', 'update', 'delete'] }
        ];
      } else if (role === 'editor') {
        return [
          { resource: 'admin', actions: ['read'] },
          { resource: 'products', actions: ['create', 'read', 'update'] },
          { resource: 'rfp_requests', actions: ['create', 'read', 'update'] },
          { resource: 'categories', actions: ['read', 'update'] },
          { resource: 'partners', actions: ['create', 'read', 'update'] },
          { resource: 'content', actions: ['create', 'read', 'update', 'delete'] }
        ];
      } else {
        return [
          { resource: 'admin', actions: ['read'] }
        ];
      }
    };

    // Return user data with permissions
    return NextResponse.json({
      success: true,
      data: {
        ...userData,
        permissions: getPermissionsByRole(userData.role),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });

  } catch (error) {
    // Log to proper logging service in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth check error:', error);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication check failed',
        },
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}