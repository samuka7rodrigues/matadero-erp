'use client';

import { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from './locale-switcher';
import { MobileNav } from './sidebar';
import { logoutAction } from '@/actions/auth';

interface HeaderProps {
  user: User;
  allowedMenus: string[];
}

export function Header({ user, allowedMenus }: HeaderProps) {
  const t = useTranslations('Auth');

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileNav allowedMenus={allowedMenus} />
        <span className="hidden text-sm text-muted-foreground sm:block">
          {user.email}
        </span>
      </div>
      <div className="flex items-center gap-2 lg:gap-3">
        <LocaleSwitcher />
        <form action={logoutAction}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">{t('logout')}</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
