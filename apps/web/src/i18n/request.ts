import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['pt-BR', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-BR';

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl v3.22+: usa requestLocale em vez de locale
  const requested = await requestLocale;
  const locale = (requested || defaultLocale) as Locale;

  if (!locales.includes(locale)) notFound();

  return {
    locale, // <-- OBRIGATÓRIO no next-intl v3.22+, sem isto as Server Components crasham
    messages: (await import(`../../../../packages/i18n/messages/${locale}.json`))
      .default,
  };
});