import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { HierarchicalCategoryManager } from '@/components/admin/categories/HierarchicalCategoryManager';

export default function CategoriesPage() {
  return (
    <AdminLayout>
      <HierarchicalCategoryManager />
    </AdminLayout>
  );
}