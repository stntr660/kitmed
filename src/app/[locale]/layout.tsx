import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Poppins } from 'next/font/google';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { RFPCart } from '@/components/rfp/rfp-cart';
import { Toaster } from '@/components/ui/toaster';
import { locales } from '@/i18n';
import type { Locale } from '@/types';

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

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
    <html lang={locale} className="h-full">
      <body className={`${poppins.className} min-h-full bg-medical-bg`}>
        <NextIntlClientProvider messages={messages}>
          {children}

          {/* Global Components */}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}