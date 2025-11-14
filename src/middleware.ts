import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'fr'],
  
  // Used when no locale matches - French is now primary
  defaultLocale: 'fr',
  
  // Locale detection options  
  localeDetection: false,
  
  // Always use locale prefix to avoid conflicts
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  // Skip middleware for static files and assets first
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return;
  }

  // Check maintenance mode - block everything except health check
  if (process.env.MAINTENANCE_MODE === 'true') {
    // Allow health check API for monitoring
    if (request.nextUrl.pathname === '/api/health') {
      return;
    }
    
    // Block all other API routes during maintenance
    if (request.nextUrl.pathname.startsWith('/api')) {
      return new Response('Service temporarily unavailable', { 
        status: 503,
        headers: {
          'Retry-After': '3600' // 1 hour
        }
      });
    }
    
    // Allow access to the maintenance page itself and its assets
    if (request.nextUrl.pathname === '/fr/maintenance') {
      return;
    }
    
    // For all other routes, rewrite to maintenance page (keeps original URL)
    const url = request.nextUrl.clone();
    url.pathname = '/fr/maintenance';
    return NextResponse.rewrite(url);
  }

  // Skip other API routes from normal middleware processing
  if (request.nextUrl.pathname.startsWith('/api')) {
    return;
  }

  // Only redirect /admin routes that don't have locale prefixes
  // This allows /en/admin and /fr/admin to work properly - now defaults to French
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
    const url = request.nextUrl.clone();
    url.pathname = `/fr${url.pathname}`;
    return Response.redirect(url);
  }

  // Let next-intl middleware handle locale routing
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  // Note: Update matcher when Arabic support is added: /(fr|en|ar)/:path*
  matcher: ['/', '/(fr|en)/:path*', '/admin/:path*']
};