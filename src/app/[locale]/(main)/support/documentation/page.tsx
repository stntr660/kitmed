import { redirect } from 'next/navigation';

// Former template page (placeholder figures, inactive form): now served by /catalogues.
export default async function SupportDocumentationRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/catalogues`);
}
