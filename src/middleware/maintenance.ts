import { NextRequest, NextResponse } from 'next/server';

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

// Check if user has valid admin authentication
function hasAdminAuthentication(request: NextRequest): boolean {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).length > 0; // Basic token presence check
  }

  // Check admin token cookie
  const adminToken = request.cookies.get('admin-token')?.value;
  if (adminToken && adminToken.length > 0) {
    return true;
  }

  return false;
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
  const shouldSkip = skipPaths.some(path => pathname.startsWith(path));
  if (shouldSkip) {
    return NextResponse.next();
  }

  // Check if maintenance mode is enabled
  const maintenanceEnabled = isMaintenanceModeEnabled();

  if (maintenanceEnabled && !pathname.includes('/maintenance')) {
    // Check if user is authenticated admin - admins can bypass maintenance mode
    const isAdminUser = hasAdminAuthentication(request);

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