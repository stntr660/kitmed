import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { maintenanceMiddleware } from './middleware/maintenance';

import { hasValidAdminToken } from './lib/edge-jwt';

const LOCALES = ['en', 'fr'];

function unauthorized() {
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

// Admin pages: /admin/..., /en/admin/..., /fr/admin/... (except the login page)
function adminPageLocale(pathname: string): string | null {
  const match = pathname.match(/^\/(?:(en|fr)\/)?admin(?:\/(.*))?$/);
  if (!match) return null;
  const rest = match[2] || '';
  if (rest === 'login' || rest.startsWith('login/')) return null;
  return match[1] || 'en';
}

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: LOCALES,
  defaultLocale: 'en'
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin API: the JWT signature and expiry are verified here (Edge runtime),
  // then again in each route handler by withAuth (role checks).
  if (pathname.startsWith('/api/admin/')) {
    if (pathname === '/api/admin/auth/login') {
      return NextResponse.next();
    }
    if (!(await hasValidAdminToken(request))) {
      return unauthorized();
    }
    return NextResponse.next();
  }

  // Admin pages: redirect to the login page without a valid token.
  // Only outside development: in development the login route does not set
  // the admin-token cookie (the token lives in localStorage only).
  if (process.env.NODE_ENV !== 'development') {
    const locale = adminPageLocale(pathname);
    if (locale && !(await hasValidAdminToken(request))) {
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }
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
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; frame-src 'self' https://www.google.com https://maps.google.com;"
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
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; frame-src 'self' https://www.google.com https://maps.google.com;"
  );

  return response;
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|images).*)',
  ],
};