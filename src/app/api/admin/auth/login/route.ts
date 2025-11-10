import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Mock user for testing purposes
const MOCK_ADMIN = {
  id: '1',
  email: 'admin@kitmed.ma',
  password: 'admin123', // In production, this should be hashed
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  status: 'ACTIVE',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Rate limiting (simplified)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check credentials against mock user
    if (email === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
      // Generate mock JWT token
      const token = 'mock-jwt-token-' + Date.now();
      
      // Create response with user data
      const user = {
        id: MOCK_ADMIN.id,
        email: MOCK_ADMIN.email,
        firstName: MOCK_ADMIN.firstName,
        lastName: MOCK_ADMIN.lastName,
        role: MOCK_ADMIN.role,
        status: MOCK_ADMIN.status,
        lastLoginAt: new Date().toISOString(),
      };

      // Set HTTP-only cookie (mock implementation)
      const response = NextResponse.json({
        success: true,
        data: {
          user,
          token,
          message: 'Login successful',
        },
      });

      // Set mock auth cookie
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      });

      return response;
    }

    // Invalid credentials
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred during login',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}