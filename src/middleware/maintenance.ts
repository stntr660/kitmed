import { NextRequest, NextResponse } from 'next/server';
import { hasValidAdminToken } from '../lib/edge-jwt';

// Simple maintenance mode check
// Only activate in production on main branch
function isMaintenanceModeEnabled(): boolean {
  // Only enable maintenance mode in production environment
  const isProduction = process.env.NODE_ENV === 'production';
  const maintenanceMode = process.env.MAINTENANCE_MODE;

  // For production: check if maintenance mode is enabled
  // For development: only if explicitly set via env variable
  if (isProduction) {
    // In production, default to maintenance mode for main branch
    return maintenanceMode !== 'false';
  } else {
    // In development, only enable if explicitly set
    return maintenanceMode === 'true' || maintenanceMode === '1';
  }
}

// Admins can bypass maintenance mode, but only with a valid, unexpired JWT
// (previously any non-empty admin-token cookie was enough).
async function hasAdminAuthentication(request: NextRequest): Promise<boolean> {
  return hasValidAdminToken(request);
}

export async function maintenanceMiddleware(request: NextRequest) {
  const { pathname, locale } = request.nextUrl;

  // Skip maintenance check for certain paths
  const skipPaths = [
    '/api/',
    '/admin/',
    '/maintenance',
    '/_next/',
    '/favicon.ico',
    '/images/',
    '/static/',
  ];

  // Check if current path should skip maintenance check
  // The admin panel (/admin/*, also with a locale prefix: /fr/admin/*) is not
  // behind maintenance, as documented in MAINTENANCE_MODE.md. Access to it is
  // controlled by the JWT check in src/middleware.ts.
  const isAdminPanel = /^\/(?:(?:en|fr)\/)?admin(?:\/|$)/.test(pathname);
  const shouldSkip = isAdminPanel || skipPaths.some(path => pathname.startsWith(path));
  if (shouldSkip) {
    return NextResponse.next();
  }

  // Check if maintenance mode is enabled
  const maintenanceEnabled = isMaintenanceModeEnabled();

  if (maintenanceEnabled && !pathname.includes('/maintenance')) {
    // Check if user is authenticated admin - admins can bypass maintenance mode
    const isAdminUser = await hasAdminAuthentication(request);

    if (!isAdminUser) {
      // Extract locale from pathname if it exists
      const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
      const currentLocale = localeMatch ? localeMatch[1] : 'fr';

      // Redirect to maintenance page with proper locale
      const maintenanceUrl = new URL(`/${currentLocale}/maintenance`, request.url);
      return NextResponse.redirect(maintenanceUrl);
    }

    // Admin user - allow access but add a warning header
    const response = NextResponse.next();
    response.headers.set('X-Maintenance-Mode', 'active');
    response.headers.set('X-Admin-Bypass', 'true');
    return response;
  }

  return NextResponse.next();
}