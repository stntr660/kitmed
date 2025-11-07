import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  // Note: 'ar' (Arabic) prepared for future expansion
  locales: ['en', 'fr'],
  
  // Used when no locale matches
  defaultLocale: 'fr',
  
  // Locale detection options
  localeDetection: true,
  
  // Redirect to default locale when no locale is provided
  localePrefix: 'as-needed'
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

  // Redirect old admin routes to locale-aware routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${url.pathname}`;
    return Response.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  // Note: Update matcher when Arabic support is added: /(fr|en|ar)/:path*
  matcher: ['/', '/(fr|en)/:path*', '/admin/:path*']
};