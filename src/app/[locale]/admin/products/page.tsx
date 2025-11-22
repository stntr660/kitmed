'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Disable SSR for admin components completely
const AdminLayout = dynamic(() => import('@/components/admin/layout/AdminLayout').then(mod => ({ default: mod.AdminLayout })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" />
    </div>
  )
});

const UnifiedProductList = dynamic(() => import('@/components/admin/products/UnifiedProductList').then(mod => ({ default: mod.UnifiedProductList })), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center">
      <LoadingSpinner />
    </div>
  )
});

export default function AdminProductsPage() {
  return (
    <AdminLayout>
      <UnifiedProductList />
    </AdminLayout>
  );
}