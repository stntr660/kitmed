import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { ContactSubmissionsList } from '@/components/admin/contact/ContactSubmissionsList';

export default function AdminContactPage() {
  return (
    <AdminLayout>
      <ContactSubmissionsList />
    </AdminLayout>
  );
}
