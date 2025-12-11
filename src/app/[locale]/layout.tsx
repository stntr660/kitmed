import { NextIntlClientProvider } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'fr'];

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    title: locale === 'fr' ? 'KITMED - Plateforme d\'Équipement Médical' : 'KITMED - Medical Equipment Platform',
    description: locale === 'fr'
      ? 'Équipements et solutions médicales professionnels pour les prestataires de soins de santé'
      : 'Professional medical equipment and solutions for healthcare providers',
    keywords: locale === 'fr'
      ? 'équipement médical, dispositifs médicaux, hôpital, clinique, laboratoire'
      : 'medical equipment, medical devices, hospital, clinic, laboratory',
    openGraph: {
      title: 'KITMED',
      description: locale === 'fr'
        ? 'Équipements et solutions médicales professionnels'
        : 'Professional medical equipment and solutions',
      type: 'website',
      locale: locale,
      alternateLocale: locale === 'fr' ? 'en' : 'fr',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  // Import messages directly
  let messages = {};
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    // Fallback to English if locale file doesn't exist
    messages = (await import(`@/messages/en.json`)).default;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}