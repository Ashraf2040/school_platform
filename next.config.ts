import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './src/i18n.ts' // 👈 مكان ملف i18n الصح
);

const nextConfig = {
  reactStrictMode: true
};

export default withNextIntl(nextConfig);