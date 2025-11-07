import { NextRequest, NextResponse } from 'next/server';

// Mock admin user (matches the one in login)
const MOCK_ADMIN = {
  id: '1',
  email: 'admin@kitmed.ma',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  status: 'ACTIVE',
};

export async function GET(request: NextRequest) {
  try {
    // Check for authentication token
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('admin-token')?.value;
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken;
    
    if (!token || !token.startsWith('mock-jwt-token-')) {
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

    // Return mock user data (in production, verify JWT and fetch from database)
    return NextResponse.json({
      success: true,
      data: {
        id: MOCK_ADMIN.id,
        email: MOCK_ADMIN.email,
        firstName: MOCK_ADMIN.firstName,
        lastName: MOCK_ADMIN.lastName,
        role: MOCK_ADMIN.role,
        status: MOCK_ADMIN.status,
        lastLoginAt: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
        permissions: ['admin:read', 'admin:write', 'products:manage', 'rfp:manage'],
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