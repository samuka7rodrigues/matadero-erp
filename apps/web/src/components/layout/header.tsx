import { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from './locale-switcher';
import { logoutAction } from '@/actions/auth';

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {user.email}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <LocaleSwitcher />
        <form action={logoutAction}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
