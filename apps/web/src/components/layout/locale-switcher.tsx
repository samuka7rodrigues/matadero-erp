'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname, type Locale } from '@/i18n/config';
import { Languages } from 'lucide-react';
import { useTransition } from 'react';

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [, startTransition] = useTransition();

  function onSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <select
        value={locale}
        onChange={onSelectChange}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="pt-BR">🇧🇷 PT</option>
        <option value="es">🇪🇸 ES</option>
      </select>
    </div>
  );
}
