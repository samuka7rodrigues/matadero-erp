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
  Home,
  Settings,
  Shield,
  ChevronDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingDown,
  Calculator,
  ChartPie,
} from 'lucide-react';
import type { RoleUtilizador } from '@/types/database';

interface NavItem {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  roles: RoleUtilizador[];
}

interface NavGroup {
  labelKey: string;
  icon: typeof LayoutDashboard;
  roles: RoleUtilizador[];
  items: NavItem[];
}

type NavEntry = { type: 'item'; item: NavItem } | { type: 'group'; group: NavGroup };

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'Nav.dashboard', icon: LayoutDashboard, roles: ['admin', 'rh', 'financeiro', 'encarregado', 'colaborador', 'auditor'] },
  { href: '/empresas', labelKey: 'Nav.empresa', icon: Building2, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
  { href: '/alojamientos', labelKey: 'Nav.alojamentos', icon: Home, roles: ['admin', 'rh', 'auditor'] },
  { href: '/colaboradores', labelKey: 'Nav.colaboradores', icon: Users, roles: ['admin', 'rh', 'encarregado', 'auditor'] },
  { href: '/contratos', labelKey: 'Nav.contratos', icon: FileText, roles: ['admin', 'rh', 'auditor'] },
  { href: '/ponto', labelKey: 'Nav.ponto', icon: Clock, roles: ['admin', 'rh', 'encarregado', 'colaborador', 'auditor'] },
  { href: '/turnos', labelKey: 'Nav.turnos', icon: Calendar, roles: ['admin', 'rh', 'encarregado', 'auditor'] },
  { href: '/departamentos', labelKey: 'Nav.rh', icon: Building2, roles: ['admin', 'rh', 'auditor'] },
  { href: '/utilizadores', labelKey: 'Nav.utilizadores', icon: Shield, roles: ['admin'] },
  { href: '/configuracoes', labelKey: 'Nav.configuracoes', icon: Settings, roles: ['admin'] },
];

const finanzasGroup: NavGroup = {
  labelKey: 'Nav.finanzas',
  icon: Wallet,
  roles: ['admin', 'financeiro', 'rh', 'auditor'],
  items: [
    { href: '/finanzas', labelKey: 'Nav.finanzasResumen', icon: ChartPie, roles: ['admin', 'financeiro', 'auditor'] },
    { href: '/faturas', labelKey: 'Nav.faturas', icon: Receipt, roles: ['admin', 'financeiro', 'auditor'] },
    { href: '/cobros', labelKey: 'Nav.cobros', icon: ArrowDownToLine, roles: ['admin', 'financeiro', 'auditor'] },
    { href: '/pagos', labelKey: 'Nav.pagos', icon: ArrowUpFromLine, roles: ['admin', 'financeiro', 'auditor'] },
    { href: '/despesas', labelKey: 'Nav.despesas', icon: TrendingDown, roles: ['admin', 'financeiro', 'auditor'] },
    { href: '/presupuestos', labelKey: 'Nav.presupuestos', icon: FileText, roles: ['admin', 'financeiro', 'auditor'] },
    { href: '/nominas', labelKey: 'Nav.nominas', icon: Calculator, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
    { href: '/horas-extras', labelKey: 'Nav.horasExtras', icon: Clock, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
    { href: '/finanzas/rentabilidad', labelKey: 'Nav.rentabilidad', icon: ChartPie, roles: ['admin', 'financeiro', 'auditor'] },
  ],
};

const navEntries: NavEntry[] = [
  ...navItems.map((item) => ({ type: 'item', item }) as NavEntry),
  { type: 'group', group: finanzasGroup },
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
          'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          {t(group.labelKey)}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        />
      </Button>
      {open && (
        <div className="ml-3 flex flex-col gap-0.5 border-l pl-3">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarNav({ role, onNavigate }: { role: RoleUtilizador; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-4">
      {navEntries.map((entry) => {
        if (entry.type === 'item') {
          if (!entry.item.roles.includes(role)) return null;
          return <NavLink key={entry.item.href} item={entry.item} onNavigate={onNavigate} />;
        }
        if (!entry.group.roles.includes(role)) return null;
        return <NavGroupMenu key={entry.group.labelKey} group={entry.group} onNavigate={onNavigate} />;
      })}
    </nav>
  );
}

export function Sidebar({ role }: { role: RoleUtilizador }) {
  return (
    <aside className="hidden w-64 border-r bg-card lg:block">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">ERP Matadero</h1>
      </div>
      <SidebarNav role={role} />
    </aside>
  );
}

export function MobileNav({ role }: { role: RoleUtilizador }) {
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
            <div className="flex flex-1 flex-col overflow-y-auto">
              <SidebarNav role={role} onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
