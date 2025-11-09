'use client';

import React, { useState } from 'react';
import { usePathname, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslations } from 'next-intl';
import {
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  MegaphoneIcon,
  BuildingOfficeIcon,
  PowerIcon,
  RectangleGroupIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { AdminUser } from '@/types/admin';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  description?: string;
  badge?: string;
  permission?: string;
}

/**
 * Unified Admin Sidebar Component
 *
 * Features:
 * - Simplified navigation without nested submenus
 * - Full i18n support with next-intl
 * - Mobile-first responsive design with 48px+ touch targets
 * - Smooth animations and transitions
 * - RTL support for Arabic
 * - Unified design following KITMED branding
 * - Permission-based navigation items
 *
 * UX Strategy:
 * - Each section is a complete workspace with in-context actions
 * - No fragmented workflows across multiple pages
 * - Reduced cognitive load with clear, unified interfaces
 */
interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  user: AdminUser;
}

// Unified navigation without nested children
function getNavigation(locale: string, t: ReturnType<typeof useTranslations>): NavigationItem[] {
  return [
    {
      name: t('admin.sidebar.dashboard'),
      href: `/${locale}/admin`,
      icon: HomeIcon,
      exact: true,
    },
    {
      name: t('admin.sidebar.products'),
      href: `/${locale}/admin/products`,
      icon: CubeIcon,
      description: t('admin.manageProducts'),
    },
    {
      name: t('admin.sidebar.rfpRequests'),
      href: `/${locale}/admin/rfp-requests`,
      icon: DocumentTextIcon,
      badge: t('admin.sidebar.pending'),
    },
    {
      name: t('admin.sidebar.partners'),
      href: `/${locale}/admin/partners`,
      icon: BuildingOfficeIcon,
    },
    {
      name: t('admin.sidebar.categories'),
      href: `/${locale}/admin/categories`,
      icon: RectangleGroupIcon,
      description: t('admin.categories.manageDescription'),
    },
    {
      name: t('admin.sidebar.content'),
      href: `/${locale}/admin/content`,
      icon: MegaphoneIcon,
    },
    {
      name: t('admin.sidebar.users'),
      href: `/${locale}/admin/users`,
      icon: UsersIcon,
      permission: 'users',
    },
    {
      name: t('admin.sidebar.analytics'),
      href: `/${locale}/admin/analytics`,
      icon: ChartBarIcon,
    },
    {
      name: t('admin.sidebar.settings'),
      href: `/${locale}/admin/settings`,
      icon: CogIcon,
      permission: 'settings',
    },
  ];
}

function hasPermission(user: AdminUser, permission?: string): boolean {
  if (!permission) return true;
  if (user.role === 'admin') return true;

  // Special case: always allow settings access for admin role
  if (permission === 'settings' && user.role === 'admin') return true;

  // Check specific permissions
  return user.permissions?.some(p => p.resource === permission && p.actions.includes('read')) || false;
}

function NavItem({ item, pathname, user }: { item: NavigationItem; pathname: string; user: AdminUser }) {
  const [isLoading, setIsLoading] = useState(false);
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

  if (item.permission && !hasPermission(user, item.permission)) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isActive) return; // Don't show loading for current page
    
    setIsLoading(true);
    
    // Reset loading state after navigation (in case it doesn't complete)
    setTimeout(() => setIsLoading(false), 3000);
  };

  const baseClasses = cn(
    'group flex items-center justify-between px-6 py-4 text-base font-semibold rounded-2xl transition-all duration-200 mb-2 relative overflow-hidden min-h-[60px] touch-manipulation mx-4',
    isActive
      ? 'bg-white text-primary-600 shadow-lg transform translate-x-1'
      : isLoading
      ? 'bg-white/20 text-white scale-[0.98] shadow-md'
      : 'text-white/90 hover:text-white hover:bg-white/15 hover:scale-[1.02] hover:translate-x-1 hover:shadow-md'
  );

  return (
    <div className="animate-in slide-in-from-left duration-300">
      <Link href={item.href} className={baseClasses} onClick={handleClick}>
        <div className="flex items-center flex-1">
          {item.icon && (
            <item.icon
              className={cn(
                'mr-4 h-7 w-7 flex-shrink-0 transition-all duration-300',
                isActive 
                  ? 'text-primary-600' 
                  : isLoading
                  ? 'text-white animate-spin'
                  : 'text-white/80 group-hover:text-white group-hover:scale-110'
              )}
            />
          )}
          <div className="flex-1">
            <span className="font-semibold tracking-wide text-left block">
              {isLoading ? 'Chargement...' : item.name}
            </span>
            {item.description && !isLoading && (
              <span
                className={cn(
                  'text-xs mt-1 block font-medium transition-colors duration-300',
                  isActive ? 'text-primary-500' : 'text-white/70 group-hover:text-white/90'
                )}
              >
                {item.description}
              </span>
            )}
            {isLoading && (
              <span className="text-xs mt-1 block font-medium text-white/90">
                Préparation de la page...
              </span>
            )}
          </div>
        </div>
        {item.badge && !isLoading && (
          <Badge className="ml-3 text-xs bg-accent-500 hover:bg-accent-600 border-none text-white px-3 py-1 font-semibold animate-pulse">
            {item.badge}
          </Badge>
        )}
        {isLoading && (
          <div className="ml-3 w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
      </Link>
    </div>
  );
}

function SidebarContent({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations();

  const navigation = getNavigation(locale, t);

  const handleLogout = async () => {
    document.cookie = 'admin-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/admin/login';
  };

  return (
    <div className="flex h-full flex-col bg-primary-600 relative overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background decoration with KITMED blue */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full transform translate-x-32 -translate-y-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full transform -translate-x-24 translate-y-24" />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary-400/10 rounded-full transform -translate-x-1/2 -translate-y-1/2" />

      {/* Logo Section */}
      <div className="relative z-10 flex h-32 items-center justify-center px-6 py-4 border-b border-white/15 animate-in slide-in-from-top duration-500">
        <Link href={`/${locale}/admin`} className="group flex flex-col items-center justify-center transition-all duration-300 w-full h-full">
          <div className="w-full flex justify-center hover:scale-105 transition-transform duration-300 mb-3">
            <Logo variant="white" size="lg" />
          </div>
          <div className="text-center">
            <p className="text-sm text-white/90 font-medium">
              {t('admin.sidebar.adminDashboard')}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <div className="space-y-1">
          {navigation.map((item, index) => (
            <div
              key={item.href}
              className="animate-in slide-in-from-left duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <NavItem
                item={item}
                pathname={pathname}
                user={user}
              />
            </div>
          ))}
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="relative z-10 border-t border-white/15 p-6 animate-in slide-in-from-bottom duration-500 delay-300">
        <div className="mb-6 flex items-center space-x-4 p-5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
          <div className="h-16 w-16 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center ring-2 ring-white/40 hover:scale-110 transition-transform duration-200 shadow-lg">
            <span className="text-xl font-bold text-white tracking-wide">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-white truncate font-poppins mb-1">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-white/90 capitalize font-semibold px-3 py-1 rounded-full bg-white/20 inline-block">
              {user.role}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-2xl text-white/90 hover:text-white hover:bg-white/15 transition-all duration-300 group hover:scale-[1.02] min-h-[60px] font-bold touch-manipulation"
        >
          <PowerIcon className="h-7 w-7 transition-transform group-hover:scale-110" />
          <span className="font-bold">{t('admin.sidebar.signOut')}</span>
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar({ open, onClose, user }: AdminSidebarProps) {
  return (
    <>
      {/* Mobile sidebar */}
      <Transition show={open} as={React.Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={React.Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={React.Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-80 flex-1">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="p-4 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200 hover:scale-110 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-7 w-7 text-white" />
                    </button>
                  </div>
                </Transition.Child>

                <div className="flex grow flex-col overflow-hidden rounded-r-2xl shadow-2xl">
                  <SidebarContent user={user} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-80 lg:flex-col animate-in slide-in-from-left duration-500">
        <div className="flex grow flex-col overflow-hidden shadow-2xl border-r border-primary-400/30">
          <SidebarContent user={user} />
        </div>
      </div>
    </>
  );
}