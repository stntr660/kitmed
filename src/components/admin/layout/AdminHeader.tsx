'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { AdminUser } from '@/types/admin';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';
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
  const router = useRouter();

  // Mock notifications for demo
  const notifications = [
    {
      id: 1,
      title: t('admin.header.newRfpAlert'),
      message: t('admin.header.rfpAlertMessage'),
      time: t('admin.header.timeAgo.fiveMinAgo'),
      unread: true,
      type: 'rfp'
    },
    {
      id: 2,
      title: t('admin.header.stockAlert'),
      message: t('admin.header.stockAlertMessage'),
      time: t('admin.header.timeAgo.oneHourAgo'),
      unread: true,
      type: 'inventory'
    },
    {
      id: 3,
      title: t('admin.header.productAddedAlert'),
      message: t('admin.header.productAlertMessage'),
      time: t('admin.header.timeAgo.twoHoursAgo'),
      unread: false,
      type: 'product'
    }
  ];

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('admin-token');
    document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    
    // Redirect to login
    router.push('/en/admin/login');
  };

  const unreadCount = notifications.filter(n => n.unread).length;

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
              placeholder={t('searchPlaceholder')}
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
          <Menu as="div" className="relative">
            <Menu.Button className="relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200">
              <span className="sr-only">{t('admin.header.viewNotifications')}</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-medium">
                  {unreadCount}
                </span>
              )}
            </Menu.Button>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Panel className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-gray-900/5">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">{t('notifications')}</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <Menu.Item key={notification.id}>
                      {({ active }) => (
                        <div className={cn(
                          'flex items-start px-4 py-3 transition-colors',
                          active ? 'bg-gray-50' : '',
                          notification.unread ? 'bg-blue-50/50' : ''
                        )}>
                          <div className="flex-shrink-0">
                            <div className={cn(
                              'w-2 h-2 rounded-full mt-2',
                              notification.type === 'rfp' ? 'bg-green-400' :
                              notification.type === 'inventory' ? 'bg-yellow-400' :
                              'bg-blue-400'
                            )} />
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      )}
                    </Menu.Item>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-100">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    {t('viewAllNotifications')}
                  </button>
                </div>
              </Menu.Panel>
            </Transition>
          </Menu>

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-x-3 text-sm leading-6 text-gray-900 hover:bg-gray-50 rounded-xl px-3 py-2 transition-all duration-200">
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
            </Menu.Button>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Panel className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl bg-white py-1 shadow-xl ring-1 ring-gray-900/5">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                  <p className="text-xs text-primary-600 font-medium mt-1">{user.role}</p>
                </div>
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={cn(
                        'flex w-full items-center px-4 py-2 text-sm text-gray-700 transition-colors',
                        active ? 'bg-gray-50' : ''
                      )}
                    >
                      {t('yourProfile')}
                    </button>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={cn(
                        'flex w-full items-center px-4 py-2 text-sm text-gray-700 transition-colors',
                        active ? 'bg-gray-50' : ''
                      )}
                    >
                      {t('settings')}
                    </button>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={cn(
                        'flex w-full items-center px-4 py-2 text-sm text-gray-700 transition-colors',
                        active ? 'bg-gray-50' : ''
                      )}
                    >
                      {t('signOut')}
                    </button>
                  )}
                </Menu.Item>
              </Menu.Panel>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
}