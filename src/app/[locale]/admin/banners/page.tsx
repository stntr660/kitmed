import { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { BannerManagement } from '@/components/admin/banners/BannerManagement';

export const metadata: Metadata = {
  title: 'Banner Management - KitMed Admin',
  description: 'Create and manage homepage banners',
};

export default function BannersPage() {
  return (
    <AdminLayout>
      <BannerManagement />
    </AdminLayout>
  );
}