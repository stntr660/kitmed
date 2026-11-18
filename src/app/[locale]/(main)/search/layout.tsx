import type { Metadata } from 'next';
import { robotsMetadata, isStaging } from '@/lib/seo/site';

// Internal search results: never indexed (thin, query-dependent pages).
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return {
    title: { absolute: params.locale === 'en' ? 'Search — KITMED' : 'Recherche — KITMED' },
    robots: isStaging() ? robotsMetadata() : { index: false, follow: true },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
