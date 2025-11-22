import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth, getAdminUser } from '@/lib/auth-utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      const dbUser = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        },
      });

      if (dbUser && dbUser.isActive) {
        userData = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role,
          status: dbUser.isActive ? 'ACTIVE' : 'INACTIVE',
          lastLoginAt: dbUser.lastLogin?.toISOString() || new Date().toISOString(),
          createdAt: dbUser.createdAt.toISOString(),
          updatedAt: dbUser.updatedAt.toISOString(),
        };
      }
    } catch (dbError) {
      console.error('Database user lookup failed:', dbError);
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
    console.error('Auth check error:', error);

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