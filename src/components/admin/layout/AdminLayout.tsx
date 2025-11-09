'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminBreadcrumb } from './AdminBreadcrumb';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { SimplePageLoader } from '@/components/ui/simple-loading';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, error } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if not authenticated (preserve current locale)
  useEffect(() => {
    if (!loading && !user) {
      const currentLocale = pathname?.match(/^\/(en|fr)/)?.[1] || 'fr';
      router.push(`/${currentLocale}/admin/login`);
    }
  }, [user, loading, router, pathname]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              const currentLocale = pathname?.match(/^\/(en|fr)/)?.[1] || 'fr';
              router.push(`/${currentLocale}/admin/login`);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </Card>
      </div>
    );
  }

  // Don't render layout if no user
  if (!user) {
    return null;
  }

  // Check if current page requires special layout (like login)
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/forgot-password');
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <NotificationProvider userId={user?.id}>
      <SimplePageLoader />
      <div className="min-h-screen bg-gradient-to-br from-medical-bg to-gray-50/50">
        {/* Sidebar */}
        <ErrorBoundary>
          <AdminSidebar 
            open={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            user={user}
          />
        </ErrorBoundary>

        {/* Main content area */}
        <div className="lg:pl-80">
          {/* Header */}
          <ErrorBoundary>
            <AdminHeader 
              onMenuClick={() => setSidebarOpen(true)}
              user={user}
            />
          </ErrorBoundary>

          {/* Breadcrumb */}
          <ErrorBoundary>
            <AdminBreadcrumb />
          </ErrorBoundary>

          {/* Page content */}
            <main className="p-6 sm:p-8 lg:p-10 min-h-[calc(100vh-8rem)]">
            <div className="max-w-7xl mx-auto">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
            </main>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </NotificationProvider>
  );
}

// Loading skeleton for admin layout
export function AdminLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:pl-64">
        {/* Header skeleton */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Breadcrumb skeleton */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex space-x-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Content skeleton */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Sidebar skeleton */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 hidden lg:block">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-4">
            <div className="h-8 w-32 bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="flex-1 px-4 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}