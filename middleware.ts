import { NextRequest, NextResponse } from 'next/server';
import { createIntlMiddleware } from 'next-intl/middleware';

// Import maintenance middleware
import { maintenanceMiddleware } from './src/middleware/maintenance';

// Supported locales
const locales = ['en', 'fr'];
const defaultLocale = 'fr';

// Create internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes that don't need maintenance check
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Apply internationalization first
  const intlResponse = intlMiddleware(request);
  
  // If intl middleware returns a redirect, return it
  if (intlResponse.status === 302 || intlResponse.status === 301) {
    return intlResponse;
  }

  // Apply maintenance middleware
  const maintenanceResponse = await maintenanceMiddleware(request);
  
  // If maintenance middleware returns a redirect, return it
  if (maintenanceResponse.status === 302 || maintenanceResponse.status === 301) {
    return maintenanceResponse;
  }

  // Return the intl response if no maintenance redirect
  return intlResponse;
}

export const config = {
  // Match all pathnames except for
  // - api routes
  // - _next (Next.js internals)
  // - _static (inside /public)
  // - all items inside /public (images, favicon, etc.)
  matcher: ['/((?!api|_next|_static|.*\\..*).*)']
};