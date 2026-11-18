import type { Metadata } from 'next';
import { staticPageMetadata } from '@/lib/seo/site';

// Page title, description, canonical and hreflang (the page itself is a client component)
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return staticPageMetadata('catalogues', params.locale);
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
