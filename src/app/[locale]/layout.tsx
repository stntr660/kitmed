import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import type { Locale } from '@/types';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
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
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}