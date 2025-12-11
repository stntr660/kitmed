import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const locale = await requestLocale;
  
  // Default to 'fr' if locale is undefined or not in supported list
  const supportedLocales = ['en', 'fr'];
  const validLocale = locale && supportedLocales.includes(locale) ? locale : 'en';
  
  return {
    messages: (await import(`./src/messages/${validLocale}.json`)).default
  };
});