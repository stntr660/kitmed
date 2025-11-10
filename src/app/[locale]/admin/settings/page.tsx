import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { SettingsManagement } from '@/components/admin/settings/SettingsManagement';

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <SettingsManagement />
    </AdminLayout>
  );
}