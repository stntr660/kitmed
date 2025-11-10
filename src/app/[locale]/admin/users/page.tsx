import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { UsersManagement } from '@/components/admin/users/UsersManagement';

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <UsersManagement />
    </AdminLayout>
  );
}