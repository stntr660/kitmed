import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { UnifiedPartnerList } from '@/components/admin/partners/UnifiedPartnerList';

export default function PartnersPage() {
  return (
    <AdminLayout>
      <UnifiedPartnerList />
    </AdminLayout>
  );
}