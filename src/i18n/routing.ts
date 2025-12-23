// i18n/routing.ts
import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ar'] as const,
  defaultLocale: 'en',
  localePrefix: 'always'
});
