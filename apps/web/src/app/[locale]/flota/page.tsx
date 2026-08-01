import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/config';
import {
  Truck,
  UserCog,
  FileCheck2,
  ShieldCheck,
  Wrench,
  Fuel,
  Gauge,
  AlertOctagon,
} from 'lucide-react';

interface ModuloCard {
  href: string;
  icon: typeof Truck;
  labelKey: string;
  count?: number;
  warning?: boolean;
}

export default async function FlotaPage() {
  const t = await getTranslations('Flota');
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);
  const todayPlus60 = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  const todayPlus90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const startOfMonth = `${today.slice(0, 8)}01`;

  const [vehiculos, itvVencer, segurosVencer, multasPendentes, combustible, mantenimientos] =
    await Promise.all([
      supabase.from('flota_vehiculos').select('id', { count: 'exact', head: true }).neq('estado', 'baja'),
      supabase
        .from('flota_itv')
        .select('id', { count: 'exact', head: true })
        .gte('fecha_validez', today)
        .lte('fecha_validez', todayPlus60),
      supabase
        .from('flota_seguros')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activo')
        .gte('fecha_fin', today)
        .lte('fecha_fin', todayPlus90),
      supabase.from('flota_multas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('flota_combustible').select('importe').gte('fecha', startOfMonth),
      supabase.from('flota_mantenimiento').select('id', { count: 'exact', head: true }),
    ]);

  const combustibleMes =
    (combustible.data || []).reduce((acc, r) => acc + (r.importe || 0), 0) || 0;

  const kpis = [
    { label: t('kpis.vehiculos'), value: vehiculos.count || 0, icon: Truck },
    { label: t('kpis.itvVencer'), value: itvVencer.count || 0, icon: FileCheck2, warning: (itvVencer.count || 0) > 0 },
    { label: t('kpis.segurosVencer'), value: segurosVencer.count || 0, icon: ShieldCheck, warning: (segurosVencer.count || 0) > 0 },
    { label: t('kpis.multasPendientes'), value: multasPendentes.count || 0, icon: AlertOctagon, warning: (multasPendentes.count || 0) > 0 },
    { label: t('kpis.combustibleMes'), value: combustibleMes, icon: Fuel, currency: true },
    { label: t('kpis.mantenimientos'), value: mantenimientos.count || 0, icon: Wrench },
  ];

  const modulos: ModuloCard[] = [
    { href: '/flota/vehiculos', icon: Truck, labelKey: 'hub.vehiculos', count: vehiculos.count || 0 },
    { href: '/flota/conductores', icon: UserCog, labelKey: 'hub.conductores' },
    { href: '/flota/itv', icon: FileCheck2, labelKey: 'hub.itv', count: itvVencer.count || 0, warning: (itvVencer.count || 0) > 0 },
    { href: '/flota/seguros', icon: ShieldCheck, labelKey: 'hub.seguros', count: segurosVencer.count || 0, warning: (segurosVencer.count || 0) > 0 },
    { href: '/flota/mantenimiento', icon: Wrench, labelKey: 'hub.mantenimiento' },
    { href: '/flota/combustible', icon: Fuel, labelKey: 'hub.combustible' },
    { href: '/flota/kilometraje', icon: Gauge, labelKey: 'hub.kilometraje' },
    { href: '/flota/multas', icon: AlertOctagon, labelKey: 'hub.multas', count: multasPendentes.count || 0, warning: (multasPendentes.count || 0) > 0 },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label} className="bg-slate-50">
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white ring-1 ring-slate-200">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none">
                      {'currency' in k && k.currency ? `${k.value.toLocaleString('pt-PT')} €` : k.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">{t('title')}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {modulos.map((c) => (
              <Link key={c.href} href={c.href} className="group">
                <Card className="transition-colors hover:border-primary/50 hover:bg-accent/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <c.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      {typeof c.count === 'number' && c.count > 0 && (
                        <Badge variant={c.warning ? 'destructive' : 'secondary'}>{c.count}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm">{t(c.labelKey)}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
