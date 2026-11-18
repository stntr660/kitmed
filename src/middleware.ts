import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { maintenanceMiddleware } from './middleware/maintenance';
import { botProtection } from './middleware/bot-protection';

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

  // Uploaded photos and brochures: refuse embedding by other websites. Done
  // here because files present in public/uploads are served by Next before
  // the /uploads route handler runs. No locale handling for these files.
  // Note: Next.js answers /_next/image before the middleware runs, so
  // /_next/image?url=/uploads/... cannot be filtered here (Cloudflare can).
  if (pathname.startsWith('/uploads/')) {
    // Hot-link blocking disabled (owner 2026-11-18: minimal protection, nothing that could
    // hurt link previews or AI agents). src/middleware/hotlink.ts is kept for later.
    return NextResponse.next();
  }

  // Anti-scraping: scraper user-agents (403) and per-IP rate limits (429)
  // on the public API and pages. Search/AI crawlers are allowed.
  const refused = botProtection(request);
  if (refused) {
    return refused;
  }

  // Admin API: the JWT signature and expiry are verified here (Edge runtime),
  // then again in each route handler by withAuth (role checks).
  if (pathname.startsWith('/api/admin/')) {
    // Logout stays reachable with an expired token so it can always clear the
    // cookie; it only revokes sessions for a token with a valid signature.
    if (pathname === '/api/admin/auth/login' || pathname === '/api/admin/auth/logout') {
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
    // All API routes: admin auth + anti-scraping on the public ones.
    '/api/:path*',
    // Uploaded files: hot-link protection only.
    '/uploads/:path*',
    // Pages. robots.txt, sitemap*.xml and llms*.txt are left out so they are
    // served as-is (no locale redirect, no rate limit).
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|images|robots\\.txt|sitemap.*\\.xml|llms.*\\.txt).*)',
  ],
};