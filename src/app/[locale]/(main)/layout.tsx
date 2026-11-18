import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import type { Locale } from '@/types';
import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE, STATIC_PAGES, robotsMetadata, seoLocale, siteUrl } from '@/lib/seo/site';

// Defaults for every public page. Pages set their own title, description,
// canonical and hreflang (generateMetadata); no canonical here, so a page
// without its own metadata is never declared a duplicate of the home page.
// Staging: noindex (see src/lib/seo/site.ts).
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const home = STATIC_PAGES.home[seoLocale(locale)];
  return {
    metadataBase: new URL(siteUrl()),
    title: home.title,
    description: home.description,
    openGraph: {
      title: home.title,
      description: home.description,
      siteName: 'KITMED',
      images: [DEFAULT_OG_IMAGE],
      type: 'website',
      locale: seoLocale(locale) === 'fr' ? 'fr_MA' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: home.title,
      description: home.description,
    },
    robots: robotsMetadata(),
  };
}

interface MainLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function MainLayout({ children, params }: MainLayoutProps) {
  const { locale } = await params;
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header locale={locale as Locale} />

      <main
        id="main-content"
        className="flex-1"
        role="main"
      >
        {children}
      </main>

      <Footer locale={locale as Locale} />
    </div>
  );
}