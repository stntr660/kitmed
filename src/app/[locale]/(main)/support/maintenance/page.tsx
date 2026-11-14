import { redirect } from 'next/navigation';

// Former template page (placeholder figures, inactive form): now served by /sav.
export default async function SupportMaintenanceRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/sav`);
}
