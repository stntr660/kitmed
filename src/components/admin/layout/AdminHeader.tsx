'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { AdminUser } from '@/types/admin';
import { cn } from '@/lib/utils';
import { removeAdminToken } from '@/lib/auth-utils';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationCenter } from './NotificationCenter';
import type { Locale } from '@/types';

interface AdminHeaderProps {
  user: AdminUser;
  setSidebarOpen?: (open: boolean) => void;
  onMenuClick?: () => void;
}

export function AdminHeader({ user, setSidebarOpen, onMenuClick }: AdminHeaderProps) {
  const t = useTranslations();
  const params = useParams();
  const currentLocale = (params.locale as Locale) || 'en';
  const [searchTerm, setSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    // Clear auth data using hydration-safe utility
    removeAdminToken();

    // Redirect to login
    router.push('/en/admin/login');
  };

  return (
    <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-6 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl px-6 shadow-lg shadow-gray-100/50 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 lg:hidden"
        onClick={() => setSidebarOpen ? setSidebarOpen(true) : onMenuClick && onMenuClick()}
      >
        <span className="sr-only">{t('admin.header.openSidebar')}</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Search */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <div className="relative flex-1 max-w-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="search-field"
              className="block h-12 w-full rounded-xl border-0 bg-gray-50/80 py-0 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all duration-200 sm:text-sm"
              placeholder={t('common.searchPlaceholder')}
              type="search"
              name="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Language Switcher */}
          <LanguageSwitcher currentLocale={currentLocale} />
          {/* Notifications */}
          <NotificationCenter locale={currentLocale} />

          {/* Profile dropdown */}
          <div className="relative">
            <button 
              className="flex items-center gap-x-3 text-sm leading-6 text-gray-900 hover:bg-gray-50 rounded-xl px-3 py-2 transition-all duration-200"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-2 text-sm font-semibold text-gray-900" aria-hidden="true">
                  {user.firstName} {user.lastName}
                </span>
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl bg-white py-1 shadow-xl ring-1 ring-gray-900/5">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                  <p className="text-xs text-primary-600 font-medium mt-1">{user.role}</p>
                </div>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push(`/${currentLocale}/admin/profile`);
                  }}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('dashboard.yourProfile')}
                </button>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    setNavigating(true);
                    router.push(`/${currentLocale}/admin/settings`);
                    // Reset after a delay
                    setTimeout(() => setNavigating(false), 2000);
                  }}
                  disabled={navigating}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {navigating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Chargement...
                    </>
                  ) : (
                    t('dashboard.settings')
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('dashboard.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}