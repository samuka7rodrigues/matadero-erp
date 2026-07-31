import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/request';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ERP Matadero',
  description: 'Sistema de Gestión Integral para Matadero',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // Next.js 14+: params é Promise — precisa de await
  params: Promise<{ locale: string }>;
}) {
  // Await dos params (Next.js 14+ async params)
  const { locale } = await params;

  if (!locales.includes(locale as any)) notFound();

  // next-intl v3.22+: passa locale para getMessages (devido a async params)
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
