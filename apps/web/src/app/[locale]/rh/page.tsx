import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/config';
import {
  Users,
  FileSignature,
  Building2,
  CalendarDays,
  CalendarX,
  GraduationCap,
  Award,
  HeartPulse,
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  Calculator,
  Clock,
} from 'lucide-react';

interface ModuloCard {
  href: string;
  icon: typeof Users;
  labelKey: string;
  count?: number;
  warning?: boolean;
}

export default async function RHPage() {
  const t = await getTranslations('RH');
  const supabase = createClient();

  const [ativos, feriasPendentes, ausenciasAbertas, exames, cursos, advertencias] = await Promise.all([
    supabase.from('colaboradores').select('id', { count: 'exact', head: true }).eq('estado', 'ativo').is('deleted_at', null),
    supabase.from('ferias').select('id', { count: 'exact', head: true }).eq('estado', 'pendente'),
    supabase.from('ausencias').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabase.from('v_exames_a_vencer').select('id', { count: 'exact', head: true }),
    supabase.from('cursos').select('id', { count: 'exact', head: true }).eq('estado', 'en_curso'),
    supabase.from('advertencias').select('id', { count: 'exact', head: true }).eq('estado', 'abierta'),
  ]);

  const kpis = [
    { label: t('kpis.colaboradoresAtivos'), value: ativos.count || 0, icon: Users },
    { label: t('kpis.feriasPendentes'), value: feriasPendentes.count || 0, icon: CalendarDays },
    { label: t('kpis.ausenciasAbertas'), value: ausenciasAbertas.count || 0, icon: CalendarX },
    { label: t('kpis.examesAVencer'), value: exames.count || 0, icon: HeartPulse, warning: (exames.count || 0) > 0 },
    { label: t('kpis.cursosEmCurso'), value: cursos.count || 0, icon: GraduationCap },
    { label: t('kpis.advertenciasAbertas'), value: advertencias.count || 0, icon: AlertTriangle, warning: (advertencias.count || 0) > 0 },
  ];

  const processos: ModuloCard[] = [
    { href: '/colaboradores', icon: Users, labelKey: 'hub.colaboradores', count: ativos.count || 0 },
    { href: '/contratos', icon: FileSignature, labelKey: 'hub.contratos' },
    { href: '/departamentos', icon: Building2, labelKey: 'hub.departamentos' },
    { href: '/rh/ferias', icon: CalendarDays, labelKey: 'hub.ferias', count: feriasPendentes.count || 0 },
    { href: '/rh/ausencias', icon: CalendarX, labelKey: 'hub.ausencias', count: ausenciasAbertas.count || 0 },
  ];

  const desenvolvimento: ModuloCard[] = [
    { href: '/rh/cursos', icon: GraduationCap, labelKey: 'hub.cursos' },
    { href: '/rh/certificados', icon: Award, labelKey: 'hub.certificados' },
    { href: '/rh/exames', icon: HeartPulse, labelKey: 'hub.exames', count: exames.count || 0 },
    { href: '/rh/epis', icon: ShieldCheck, labelKey: 'hub.epis' },
    { href: '/rh/advertencias', icon: AlertTriangle, labelKey: 'hub.advertencias', count: advertencias.count || 0 },
    { href: '/rh/avaliacoes', icon: ClipboardCheck, labelKey: 'hub.avaliacoes' },
    { href: '/rh/nominas', icon: Calculator, labelKey: 'hub.nominas' },
    { href: '/rh/horas-extras', icon: Clock, labelKey: 'hub.horasExtras' },
  ];

  function renderCard({ href, icon: Icon, labelKey, count, warning }: ModuloCard, key: string) {
    return (
      <Link key={key} href={href} className="group">
        <Card className="transition-colors hover:border-primary/50 hover:bg-accent/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              {typeof count === 'number' && count > 0 && (
                <Badge variant={warning ? 'destructive' : 'secondary'}>{count}</Badge>
              )}
            </div>
            <CardTitle className="text-sm">{t(labelKey)}</CardTitle>
          </CardHeader>
        </Card>
      </Link>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>

        {/* KPIs */}
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
                    <p className="text-2xl font-bold leading-none">{k.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Procesos */}
        <div>
          <h2 className="text-lg font-semibold mb-3">{t('hub.processos')}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {processos.map((c) => renderCard(c, c.href))}
          </div>
        </div>

        {/* Controlo e desenvolvimento */}
        <div>
          <h2 className="text-lg font-semibold mb-3">{t('hub.desenvolvimento')}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {desenvolvimento.map((c) => renderCard(c, c.href))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ERP Matadero</CardTitle>
            <CardDescription>Módulo de Recursos Humanos</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AppShell>
  );
}
