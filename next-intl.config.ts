import { getRequestConfig } from 'next-intl/server';

const defaultLocale = 'en';

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale ?? defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`./src/messages/${resolvedLocale}.json`)).default
  };
});
