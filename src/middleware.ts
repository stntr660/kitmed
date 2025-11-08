import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

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
  // Skip middleware for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('/.')
  ) {
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