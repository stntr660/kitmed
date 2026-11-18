import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';
import { JsonLd, organizationJsonLd } from '@/components/seo/JsonLd';
import { STATIC_PAGES, seoLocale, staticPageMetadata } from '@/lib/seo/site';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return staticPageMetadata('home', params.locale);
}

export default function HomePage({ params }: { params: { locale: string } }) {
  const loc = seoLocale(params.locale);
  return (
    <>
      <JsonLd data={organizationJsonLd(loc, STATIC_PAGES.home[loc].description)} />
      <HomePageClient />
    </>
  );
}
