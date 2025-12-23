import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { Toaster } from "react-hot-toast";

const locales = ["en", "ar"] as const;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) notFound();

  const messages = await getMessages({ locale });
 // <== لازم تبعته locale هنا

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body>
        <AuthSessionProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Toaster position="top-right" />
            {children}
          </NextIntlClientProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}