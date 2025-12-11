import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? 
    requested : routing.defaultLocale;
  
  return {
    locale,
    messages: (await import(`../src/messages/${locale}.json`)).default,
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
  };
});