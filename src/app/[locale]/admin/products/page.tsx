import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { UnifiedProductList } from '@/components/admin/products/UnifiedProductList';

export default function AdminProductsPage() {
  return (
    <AdminLayout>
      <UnifiedProductList />
    </AdminLayout>
  );
}