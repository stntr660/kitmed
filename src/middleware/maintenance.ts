import { NextRequest, NextResponse } from 'next/server';

// Simple maintenance mode check
// In production, this could check an environment variable, file, or external service
function isMaintenanceModeEnabled(): boolean {
  // Check environment variable for maintenance mode
  const maintenanceMode = process.env.MAINTENANCE_MODE;
  return maintenanceMode === 'true' || maintenanceMode === '1';
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
    // Extract locale from pathname if it exists
    const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
    const currentLocale = localeMatch ? localeMatch[1] : 'fr';
    
    // Redirect to maintenance page with proper locale
    const maintenanceUrl = new URL(`/${currentLocale}/maintenance`, request.url);
    return NextResponse.redirect(maintenanceUrl);
  }
  
  return NextResponse.next();
}