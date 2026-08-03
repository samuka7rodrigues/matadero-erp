'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/config';
import { cn, isNavItemActive } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, Beef } from 'lucide-react';
import {
  navEntries,
  type NavItem,
  type NavGroup,
} from '@/lib/navigation';

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = isNavItemActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 font-semibold text-primary'
          : 'text-muted-foreground hover:bg-sidebar-muted hover:text-foreground'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )}
      />
      {t(item.labelKey)}
    </Link>
  );
}

function NavGroupMenu({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const Icon = group.icon;
  const isActive = group.items.some((item) => isNavItemActive(pathname, item.href));
  const [open, setOpen] = useState(isActive);

  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 font-semibold text-primary'
            : 'text-muted-foreground hover:bg-sidebar-muted hover:text-foreground'
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-3">
          <Icon
            className={cn(
              'h-[18px] w-[18px] shrink-0 transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          {t(group.labelKey)}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        />
      </Button>
      {open && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarNav({ allowedMenus, onNavigate }: { allowedMenus: string[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        Menu
      </p>
      {navEntries.map((entry) => {
        if (entry.type === 'item') {
          if (!allowedMenus.includes(entry.item.href)) return null;
          return <NavLink key={entry.item.href} item={entry.item} onNavigate={onNavigate} />;
        }
        const hasAllowed = entry.group.items.some((item) => allowedMenus.includes(item.href));
        if (!hasAllowed) return null;
        return <NavGroupMenu key={entry.group.labelKey} group={entry.group} onNavigate={onNavigate} />;
      })}
    </nav>
  );
}

function Brand({ className, hideBorder = false }: { className?: string; hideBorder?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-16 items-center gap-3 px-5',
        !hideBorder && 'border-b border-sidebar-border',
        className
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-card">
        <Beef className="h-5 w-5" />
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[15px] font-bold tracking-tight text-sidebar-foreground">
          Matadero ERP
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          Gestão integral
        </span>
      </div>
    </div>
  );
}

export function Sidebar({ allowedMenus }: { allowedMenus: string[] }) {
  return (
    <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <Brand />
      <SidebarNav allowedMenus={allowedMenus} />
    </aside>
  );
}

export function MobileNav({ allowedMenus }: { allowedMenus: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
            <div className="flex items-center justify-between border-b border-sidebar-border pr-2">
              <Brand hideBorder className="flex-1" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
              <SidebarNav allowedMenus={allowedMenus} onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
