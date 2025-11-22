import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { 
  verifyPassword, 
  generateToken, 
  getAdminUser, 
  checkRateLimit, 
  resetRateLimit 
} from '@/lib/auth-utils';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Check rate limiting
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many login attempts. Please try again in 15 minutes.',
          },
        },
        { status: 429 }
      );
    }

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

    // Security delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, 200));

    // First, check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (dbUser && dbUser.isActive) {
      // Verify database user password
      const passwordMatch = await verifyPassword(password, dbUser.passwordHash);
      
      if (passwordMatch) {
        // Update last login
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { lastLogin: new Date() }
        });

        // Reset rate limit on successful login
        resetRateLimit(clientIP);

        // Convert database user to admin user format for token generation
        const userForToken = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role.toUpperCase() as 'ADMIN' | 'EDITOR', // Use actual user role from database
          status: 'ACTIVE' as const,
        };

        // Generate secure JWT token
        const token = generateToken(userForToken);
        
        // Create response with user data (excluding sensitive info)
        const userResponse = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role,
          status: dbUser.isActive ? 'ACTIVE' : 'INACTIVE',
          lastLoginAt: new Date().toISOString(),
        };

        // For development, return token in response for localStorage
        // For production, use HTTP-only cookies
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json({
            success: true,
            data: {
              user: userResponse,
              token,
              message: 'Login successful',
            },
          });
        } else {
          const response = NextResponse.json({
            success: true,
            data: {
              user: userResponse,
              message: 'Login successful',
            },
          });

          // Set secure HTTP-only cookie for production
          response.cookies.set('admin-token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60, // 24 hours
            path: '/',
          });

          return response;
        }
      }
    }

    // Fallback to environment admin user if database user not found/valid
    const adminUser = getAdminUser();
    const storedPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (storedPasswordHash) {
      // Verify credentials against environment admin
      const emailMatch = email === adminUser.email;
      const passwordMatch = await verifyPassword(password, storedPasswordHash);

      if (emailMatch && passwordMatch) {
        // Reset rate limit on successful login
        resetRateLimit(clientIP);

        // Generate secure JWT token
        const token = generateToken(adminUser);
        
        // Create response with user data (excluding sensitive info)
        const userResponse = {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          role: adminUser.role,
          status: adminUser.status,
          lastLoginAt: new Date().toISOString(),
        };

        // For development, return token in response for localStorage
        // For production, use HTTP-only cookies
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json({
            success: true,
            data: {
              user: userResponse,
              token,
              message: 'Login successful',
            },
          });
        } else {
          const response = NextResponse.json({
            success: true,
            data: {
              user: userResponse,
              message: 'Login successful',
            },
          });

          // Set secure HTTP-only cookie for production
          response.cookies.set('admin-token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60, // 24 hours
            path: '/',
          });

          return response;
        }
      }
    }

    // Invalid credentials - don't reveal which field was wrong
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          remainingAttempts: rateLimit.remainingAttempts - 1,
        },
      },
      { status: 401 }
    );

  } catch (error) {
    // Log to proper logging service in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', error);
    }
    
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
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://kitmed.ma', 'https://admin.kitmed.ma', 'https://www.kitmed.ma']  
    : ['http://localhost:3000', 'http://localhost:3001'];
    
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.join(','),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}