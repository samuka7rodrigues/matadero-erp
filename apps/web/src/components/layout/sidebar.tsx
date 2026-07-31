'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/config';
import { cn } from '@/lib/utils';
import {
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
  { href: '/dashboard', labelKey: 'Nav.dashboard', icon: LayoutDashboard, roles: ['admin', 'rh', 'financeiro', 'encarregado', 'funcionario', 'auditor'] },
  { href: '/funcionarios', labelKey: 'Nav.funcionarios', icon: Users, roles: ['admin', 'rh', 'encarregado', 'auditor'] },
  { href: '/contratos', labelKey: 'Nav.contratos', icon: FileText, roles: ['admin', 'rh', 'auditor'] },
  { href: '/ponto', labelKey: 'Nav.ponto', icon: Clock, roles: ['admin', 'rh', 'encarregado', 'funcionario', 'auditor'] },
  { href: '/turnos', labelKey: 'Nav.turnos', icon: Calendar, roles: ['admin', 'rh', 'encarregado', 'auditor'] },
  { href: '/nominas', labelKey: 'Nav.nominas', icon: Receipt, roles: ['admin', 'rh', 'funcionario', 'auditor'] },
  { href: '/faturas', labelKey: 'Nav.faturas', icon: Wallet, roles: ['admin', 'financeiro', 'auditor'] },
  { href: '/despesas', labelKey: 'Nav.despesas', icon: Wallet, roles: ['admin', 'financeiro', 'auditor'] },
  { href: '/departamentos', labelKey: 'Nav.rh', icon: Building2, roles: ['admin', 'rh', 'auditor'] },
  { href: '/utilizadores', labelKey: 'Nav.utilizadores', icon: Shield, roles: ['admin'] },
  { href: '/configuracoes', labelKey: 'Nav.configuracoes', icon: Settings, roles: ['admin'] },
];

export function Sidebar({ role }: { role: RoleUtilizador }) {
  const t = useTranslations();
  const pathname = usePathname();

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">ERP Matadero</h1>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.includes(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
        })}
      </nav>
    </aside>
  );
}
