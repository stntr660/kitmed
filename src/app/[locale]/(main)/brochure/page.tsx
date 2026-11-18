import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cleanBrochureTitle, isViewerPdfPath, safeReturnPath } from '@/lib/brochure';
import BrochurePageClient from './BrochurePageClient';

// Depends on the query string: always rendered per request.
export const dynamic = 'force-dynamic';

// /{locale}/brochure?f=/uploads/pdfs/xxx.pdf&t=<title>&r=<return path>
// Page-flip viewer for same-site PDFs (no browser PDF viewer, no download button).

interface PageProps {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const title = cleanBrochureTitle(first(searchParams.t));
  const suffix = 'Brochure — KITMED';
  return {
    title: { absolute: title ? `${title} — ${suffix}` : suffix },
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  };
}

export default function BrochurePage({ params, searchParams }: PageProps) {
  const file = first(searchParams.f);
  if (!isViewerPdfPath(file)) notFound();

  return (
    <BrochurePageClient
      locale={params.locale}
      file={file}
      title={cleanBrochureTitle(first(searchParams.t))}
      returnPath={safeReturnPath(first(searchParams.r), params.locale)}
    />
  );
}
