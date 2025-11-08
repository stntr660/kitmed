import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
// Note: 'ar' (Arabic) support prepared for future implementation
export const locales = ['en', 'fr'] as const;
export const supportedLocales = ['en', 'fr', 'ar'] as const; // Future expansion
export type Locale = typeof locales[number];
export type SupportedLocale = typeof supportedLocales[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const locale = await requestLocale;
  
  // Validate that the incoming `locale` parameter is valid
  // If no locale or invalid locale, fallback to default 'fr'
  const validLocale = locale && locales.includes(locale as any) ? locale : 'fr';

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
    timeZone: 'Europe/Paris',
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        },
      },
      number: {
        precise: {
          maximumFractionDigits: 5,
        },
      },
      list: {
        enumeration: {
          style: 'long',
          type: 'conjunction',
        },
      },
    },
    // RTL support configuration for Arabic
    direction: validLocale === 'ar' ? 'rtl' : 'ltr',
  };
});