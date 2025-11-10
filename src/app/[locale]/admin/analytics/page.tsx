import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AnalyticsDashboard } from '@/components/admin/analytics/AnalyticsDashboard';

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout>
      <AnalyticsDashboard />
    </AdminLayout>
  );
}