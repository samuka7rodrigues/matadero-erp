import type { RoleUtilizador } from '@/types/database';
import {
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
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingDown,
  Calculator,
  ChartPie,
  FileSignature,
  GraduationCap,
  Award,
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  CalendarDays,
  CalendarX,
  UserCircle,
  Truck,
  Wrench,
  Fuel,
  Gauge,
  AlertOctagon,
  FileCheck2,
  UserCog,
} from 'lucide-react';

export interface NavItem {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  roles: RoleUtilizador[];
}

export interface NavGroup {
  labelKey: string;
  icon: typeof LayoutDashboard;
  roles: RoleUtilizador[];
  items: NavItem[];
}

export type NavEntry = { type: 'item'; item: NavItem } | { type: 'group'; group: NavGroup };

export const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'Nav.dashboard', icon: LayoutDashboard, roles: ['admin', 'rh', 'financeiro', 'encarregado', 'colaborador', 'auditor'] },
  { href: '/perfil', labelKey: 'Nav.perfil', icon: UserCircle, roles: ['admin', 'rh', 'financeiro', 'encarregado', 'colaborador', 'auditor'] },
  { href: '/empresas', labelKey: 'Nav.empresa', icon: Building2, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
  { href: '/alojamientos', labelKey: 'Nav.alojamentos', icon: Home, roles: ['admin', 'rh', 'auditor'] },
  { href: '/utilizadores', labelKey: 'Nav.utilizadores', icon: Shield, roles: ['admin'] },
  { href: '/configuracoes', labelKey: 'Nav.configuracoes', icon: Settings, roles: ['admin'] },
];

export const rhGroup: NavGroup = {
  labelKey: 'Nav.rh',
  icon: Users,
  roles: ['admin', 'rh', 'encarregado', 'auditor'],
  items: [
    { href: '/colaboradores', labelKey: 'Nav.colaboradores', icon: Users, roles: ['admin', 'rh', 'encarregado', 'auditor'] },
    { href: '/contratos', labelKey: 'Nav.contratos', icon: FileSignature, roles: ['admin', 'rh', 'auditor'] },
    { href: '/departamentos', labelKey: 'Nav.departamentos', icon: Building2, roles: ['admin', 'rh', 'auditor'] },
    { href: '/rh/ferias', labelKey: 'Nav.feriasSub', icon: CalendarDays, roles: ['admin', 'rh', 'auditor'] },
    { href: '/rh/ausencias', labelKey: 'Nav.ausencias', icon: CalendarX, roles: ['admin', 'rh', 'encarregado', 'auditor'] },
    { href: '/rh/cursos', labelKey: 'Nav.cursos', icon: GraduationCap, roles: ['admin', 'rh', 'auditor'] },
    { href: '/rh/certificados', labelKey: 'Nav.certificados', icon: Award, roles: ['admin', 'rh', 'auditor'] },
    { href: '/rh/exames', labelKey: 'Nav.exames', icon: HeartPulse, roles: ['admin', 'rh', 'auditor'] },
    { href: '/rh/epis', labelKey: 'Nav.epis', icon: ShieldCheck, roles: ['admin', 'rh', 'auditor'] },
    { href: '/rh/advertencias', labelKey: 'Nav.advertencias', icon: AlertTriangle, roles: ['admin', 'rh', 'auditor'] },
    { href: '/rh/avaliacoes', labelKey: 'Nav.avaliacoes', icon: ClipboardCheck, roles: ['admin', 'rh', 'encarregado', 'auditor'] },
    { href: '/rh/nominas', labelKey: 'Nav.nominas', icon: Calculator, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
    { href: '/rh/horas-extras', labelKey: 'Nav.horasExtras', icon: Clock, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
    { href: '/ponto', labelKey: 'Nav.ponto', icon: Clock, roles: ['admin', 'rh', 'encarregado', 'colaborador', 'auditor'] },
    { href: '/turnos', labelKey: 'Nav.turnos', icon: Calendar, roles: ['admin', 'rh', 'encarregado', 'auditor'] },
  ],
};

export const finanzasGroup: NavGroup = {
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
    { href: '/finanzas/rentabilidad', labelKey: 'Nav.rentabilidad', icon: ChartPie, roles: ['admin', 'financeiro', 'auditor'] },
  ],
};

export const flotaGroup: NavGroup = {
  labelKey: 'Nav.flota',
  icon: Truck,
  roles: ['admin', 'rh', 'financeiro', 'auditor'],
  items: [
    { href: '/flota/vehiculos', labelKey: 'Nav.flotaVehiculos', icon: Truck, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
    { href: '/flota/conductores', labelKey: 'Nav.flotaConductores', icon: UserCog, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
    { href: '/flota/itv', labelKey: 'Nav.flotaItv', icon: FileCheck2, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
    { href: '/flota/seguros', labelKey: 'Nav.flotaSeguros', icon: ShieldCheck, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
    { href: '/flota/mantenimiento', labelKey: 'Nav.flotaMantenimiento', icon: Wrench, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
    { href: '/flota/combustible', labelKey: 'Nav.flotaCombustible', icon: Fuel, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
    { href: '/flota/kilometraje', labelKey: 'Nav.flotaKilometraje', icon: Gauge, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
    { href: '/flota/multas', labelKey: 'Nav.flotaMultas', icon: AlertOctagon, roles: ['admin', 'rh', 'financeiro', 'auditor'] },
  ],
};

export const navEntries: NavEntry[] = [
  ...navItems.map((item) => ({ type: 'item', item }) as NavEntry),
  { type: 'group', group: rhGroup },
  { type: 'group', group: flotaGroup },
  { type: 'group', group: finanzasGroup },
];

/** Menus sempre visíveis, independentemente das permissões. */
export const ALWAYS_MENUS = ['/dashboard', '/perfil'];

/** Menus que o perfil (role) tem acesso por defeito. */
export function menuKeysForRole(role: RoleUtilizador): string[] {
  const keys: string[] = [];
  for (const entry of navEntries) {
    if (entry.type === 'item') {
      if (entry.item.roles.includes(role)) keys.push(entry.item.href);
    } else {
      for (const item of entry.group.items) {
        if (item.roles.includes(role)) keys.push(item.href);
      }
    }
  }
  return keys;
}

/**
 * Menus efetivos de um utilizador.
 * overrideMenus presente (row em permissoes_menus) -> substitui o padrão
 * do perfil; senão usa os menus por defeito da role.
 */
export function allowedMenuKeys(role: RoleUtilizador, overrideMenus?: string[] | null): string[] {
  const base = overrideMenus ?? menuKeysForRole(role);
  return [...new Set([...ALWAYS_MENUS, ...base])];
}

export interface MenuOption {
  href: string;
  labelKey: string;
  groupKey?: string;
}

/** Opções agrupadas para a UI do admin (tela de Utilizadores). */
export function menuOptions(): MenuOption[] {
  const options: MenuOption[] = [];
  for (const entry of navEntries) {
    if (entry.type === 'item') {
      options.push({ href: entry.item.href, labelKey: entry.item.labelKey });
    } else {
      for (const item of entry.group.items) {
        options.push({ href: item.href, labelKey: item.labelKey, groupKey: entry.group.labelKey });
      }
    }
  }
  return options;
}
