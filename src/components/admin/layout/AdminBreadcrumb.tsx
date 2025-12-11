'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  name: string;
  href: string;
  current: boolean;
}

const routeLabels: Record<string, string> = {
  '/en/admin': 'Dashboard',
  '/fr/admin': 'Dashboard',
  '/en/admin/products': 'Products',
  '/fr/admin/products': 'Produits',
  '/en/admin/products/new': 'New Product',
  '/fr/admin/products/new': 'Nouveau Produit',
  '/en/admin/rfp-requests': 'RFP Requests',
  '/fr/admin/rfp-requests': 'Demandes RFP',
  '/en/admin/partners': 'Partners',
  '/fr/admin/partners': 'Partenaires',
  '/en/admin/users': 'Users',
  '/fr/admin/users': 'Utilisateurs',
  '/en/admin/analytics': 'Analytics',
  '/fr/admin/analytics': 'Analyses',
  '/en/admin/settings': 'Settings',
  '/fr/admin/settings': 'Paramètres',
};

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Extract locale from path
  const locale = segments[0]; // en or fr
  const adminPath = `/${locale}/admin`;

  // Always start with dashboard
  if (pathname !== adminPath) {
    breadcrumbs.push({
      name: 'Dashboard',
      href: adminPath,
      current: false,
    });
  }

  // Build breadcrumbs from path segments
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Skip the locale and 'admin' segments as they're already handled
    if (segment === locale || segment === 'admin') return;

    const isLast = index === segments.length - 1;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);

    breadcrumbs.push({
      name: label,
      href: currentPath,
      current: isLast,
    });
  });

  return breadcrumbs;
}

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const locale = segments[0];
  const adminPath = `/${locale}/admin`;

  // Don't show breadcrumbs on dashboard
  if (pathname === adminPath) {
    return null;
  }

  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <nav className="flex border-b border-medical-border bg-medical-surface/50 backdrop-blur-sm py-4" aria-label="Breadcrumb">
      <ol className="mx-auto flex w-full max-w-screen-xl items-center space-x-2 px-4 sm:px-6 lg:px-8">
        <li className="flex items-center">
          <Link
            href={adminPath}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-medical-text-secondary hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
          >
            <HomeIcon className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
          </Link>
        </li>

        {breadcrumbs.map((item) => (
          <li key={item.name} className="flex items-center">
            <ChevronRightIcon
              className="h-4 w-4 flex-shrink-0 text-medical-text-muted mx-2"
              aria-hidden="true"
            />

            {item.current ? (
              <span className="px-3 py-2 text-sm font-semibold text-primary-600 bg-primary-50 rounded-lg">
                {item.name}
              </span>
            ) : (
              <Link
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-medical-text-secondary hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}