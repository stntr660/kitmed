import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { maintenanceMiddleware } from './middleware/maintenance';

// Simplified auth verification for proxy (Edge Runtime compatible)
function extractTokenFromRequest(request: NextRequest): string | null {
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

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'fr'],
  defaultLocale: 'en'
});

export async function middleware(request: NextRequest) {
  // Handle admin API routes with authentication
  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    // Allow login endpoint
    if (request.nextUrl.pathname === '/api/admin/auth/login') {
      return NextResponse.next();
    }

    // Check for token presence (detailed verification happens in API routes)
    const token = extractTokenFromRequest(request);

    if (!token) {
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

    // Token exists, let the API route handle detailed verification
    return NextResponse.next();
  }

  // Handle API routes (no locale handling needed)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check maintenance mode before internationalization
  const maintenanceResponse = await maintenanceMiddleware(request);
  if (maintenanceResponse && maintenanceResponse.status !== 200) {
    return maintenanceResponse; // Redirect to maintenance page
  }

  // Handle internationalization for all other routes
  const intlResponse = intlMiddleware(request);

  // Apply security headers to the response
  if (intlResponse) {
    // Copy maintenance headers if they exist
    if (maintenanceResponse && maintenanceResponse.headers.get('X-Maintenance-Mode')) {
      intlResponse.headers.set('X-Maintenance-Mode', maintenanceResponse.headers.get('X-Maintenance-Mode')!);
      intlResponse.headers.set('X-Admin-Bypass', maintenanceResponse.headers.get('X-Admin-Bypass') || 'false');
    }
    // Security headers
    intlResponse.headers.set('X-Frame-Options', 'DENY');
    intlResponse.headers.set('X-Content-Type-Options', 'nosniff');
    intlResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    intlResponse.headers.set('X-XSS-Protection', '1; mode=block');
    intlResponse.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );

    // Content Security Policy
    intlResponse.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; frame-src 'none';"
    );

    return intlResponse;
  }

  // Fallback response with security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; frame-src 'none';"
  );

  return response;
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|images).*)',
  ],
};