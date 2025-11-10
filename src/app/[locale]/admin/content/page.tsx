import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { ContentManagement } from '@/components/admin/content/ContentManagement';

export default function AdminContentPage() {
  return (
    <AdminLayout>
      <ContentManagement />
    </AdminLayout>
  );
}