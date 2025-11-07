import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminDashboard } from '@/components/admin/dashboard/AdminDashboard';

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}