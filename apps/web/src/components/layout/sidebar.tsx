'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/config';
import { cn, isNavItemActive } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  Calendar,
  Receipt,
  Wallet,
  Building2,
  Settings,
  Shield,
} from 'lucide-react';
import type { RoleUtilizador } from '@/types/database';

interface NavItem {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  roles: RoleUtilizador[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'Nav.dashboard', icon: LayoutDashboard, roles: ['admin', 'rh', 'financeiro', 'encarregado', 'colaborador', 'auditor'] },
  { href: '/colaboradores', labelKey: 'Nav.colaboradores', icon: Users, roles: ['admin', 'rh', 'encarregado', 'auditor'] },
  { href: '/contratos', labelKey: 'Nav.contratos', icon: FileText, roles: ['admin', 'rh', 'auditor'] },
  { href: '/ponto', labelKey: 'Nav.ponto', icon: Clock, roles: ['admin', 'rh', 'encarregado', 'colaborador', 'auditor'] },
  { href: '/turnos', labelKey: 'Nav.turnos', icon: Calendar, roles: ['admin', 'rh', 'encarregado', 'auditor'] },
  { href: '/nominas', labelKey: 'Nav.nominas', icon: Receipt, roles: ['admin', 'rh', 'colaborador', 'auditor'] },
  { href: '/faturas', labelKey: 'Nav.faturas', icon: Wallet, roles: ['admin', 'financeiro', 'auditor'] },
  { href: '/despesas', labelKey: 'Nav.despesas', icon: Wallet, roles: ['admin', 'financeiro', 'auditor'] },
  { href: '/departamentos', labelKey: 'Nav.rh', icon: Building2, roles: ['admin', 'rh', 'auditor'] },
  { href: '/utilizadores', labelKey: 'Nav.utilizadores', icon: Shield, roles: ['admin'] },
  { href: '/configuracoes', labelKey: 'Nav.configuracoes', icon: Settings, roles: ['admin'] },
];

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
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      {t(item.labelKey)}
    </Link>
  );
}

export function Sidebar({ role }: { role: RoleUtilizador }) {
  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-64 border-r bg-card lg:block">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">ERP Matadero</h1>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {filteredNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}

export function MobileNav({ role }: { role: RoleUtilizador }) {
  const [open, setOpen] = useState(false);
  const filteredNav = navItems.filter((item) => item.roles.includes(role));

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
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <h1 className="text-xl font-bold text-primary">ERP Matadero</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
              {filteredNav.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
