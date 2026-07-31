/**
 * Helpers de navegação (Link, useRouter, etc.) com suporte a locales.
 * API v3: createSharedPathnamesNavigation
 */
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { locales } from './request';

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales });

// Re-exporta para compatibilidade
export { locales, defaultLocale, type Locale } from './request';