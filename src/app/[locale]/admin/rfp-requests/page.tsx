import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { UnifiedRFPList } from '@/components/admin/rfp/UnifiedRFPList';

export default function AdminRFPRequestsPage() {
  return (
    <AdminLayout>
      <UnifiedRFPList />
    </AdminLayout>
  );
}