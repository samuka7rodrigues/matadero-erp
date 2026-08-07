'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/config';
import {
  Users,
  UserPlus,
  FileX,
  HeartPulse,
  Home,
  FileText,
  Truck,
  Calendar,
  Clock,
  ArrowRight,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export interface ContratoExpirar {
  id: string;
  nombre: string;
  apellido1: string;
  nif: string;
  fecha_fin_contrato: string;
  dias_para_fim: number;
}

export interface ExameVencer {
  id: string;
  nombre: string;
  apellido1: string;
  nif: string;
  fecha_validez: string;
  dias_para_vencer: number;
}

export interface AgendaItem {
  id: string;
  tipo: 'ferias' | 'curso' | 'itv';
  titulo: string;
  data: string;
  dataFim?: string;
  estado?: string;
  link: string;
}

interface DashboardClientProps {
  totalAtivos: number;
  admitidosMes: number;
  alojamentosOcupados: number;
  faturasPendentes: number;
  flotaAtiva: number;
  contratosExpirar: ContratoExpirar[];
  examesVencer: ExameVencer[];
  agenda: AgendaItem[];
}

export function DashboardClient({
  totalAtivos,
  admitidosMes,
  alojamentosOcupados,
  faturasPendentes,
  flotaAtiva,
  contratosExpirar,
  examesVencer,
  agenda,
}: DashboardClientProps) {
  const t = useTranslations('Dashboard');

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary via-[hsl(351_70%_38%)] to-[hsl(351_60%_48%)] p-6 text-white shadow-card">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-white/80">{t('subtitle')}</p>
      </div>

      {/* KPIs Aprimorados (Baseados no uso do sistema) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t('kpis.totalColaboradores')}
          value={totalAtivos}
          icon={<Users className="h-4 w-4" />}
          href="/colaboradores"
        />
        <KpiCard
          title={t('kpis.alojamentosOcupados')}
          value={alojamentosOcupados}
          icon={<Home className="h-4 w-4" />}
          href="/alojamientos"
        />
        <KpiCard
          title={t('kpis.faturasPendentes')}
          value={faturasPendentes}
          icon={<FileText className="h-4 w-4" />}
          variant={faturasPendentes > 0 ? 'warning' : 'default'}
          href="/faturas"
        />
        <KpiCard
          title={t('kpis.flotaAtiva')}
          value={flotaAtiva}
          icon={<Truck className="h-4 w-4" />}
          href="/flota/vehiculos"
        />
      </div>

      {/* Agenda Operacional (Nova Seção no Topo) */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              {t('agendaTitle')}
            </CardTitle>
            <CardDescription>Próximos eventos, férias, cursos e inspeções</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {agenda.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('noAgenda')}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {agenda.map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  className="flex items-start justify-between gap-2 rounded-lg border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-muted/50"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.tipo === 'ferias' && <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                      {item.tipo === 'curso' && <GraduationCap className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                      {item.tipo === 'itv' && <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {item.tipo}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatDate(item.data)} {item.dataFim ? ` até ${formatDate(item.dataFim)}` : ''}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas de RH e Operações */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="border-b bg-muted/40">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{t('kpis.contratosFim')} (60 dias)</span>
              <Badge variant={contratosExpirar.length > 0 ? 'warning' : 'outline'}>
                {contratosExpirar.length}
              </Badge>
            </CardTitle>
            <CardDescription>Colaboradores com contrato a terminar</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {contratosExpirar.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Sem contratos a expirar</p>
            ) : (
              <ul className="space-y-2">
                {contratosExpirar.map((c) => (
                  <li
                    key={c.id}
                    className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
                  >
                    <div>
                      <Link href={`/colaboradores/${c.id}`} className="font-medium hover:underline">
                        {c.nombre} {c.apellido1}
                      </Link>
                      <div className="text-xs text-muted-foreground font-mono">{c.nif}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs">{formatDate(c.fecha_fin_contrato)}</div>
                      <div className="text-xs font-medium text-amber-600">{c.dias_para_fim} dias</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b bg-muted/40">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{t('kpis.examesVencer')}</span>
              <Badge variant={examesVencer.length > 0 ? 'warning' : 'outline'}>
                {examesVencer.length}
              </Badge>
            </CardTitle>
            <CardDescription>Próximos 30 dias</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {examesVencer.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Todos os exames em dia</p>
            ) : (
              <ul className="space-y-2">
                {examesVencer.map((e) => (
                  <li
                    key={e.id}
                    className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
                  >
                    <div>
                      <Link href={`/colaboradores/${e.id}`} className="font-medium hover:underline">
                        {e.nombre} {e.apellido1}
                      </Link>
                      <div className="text-xs text-muted-foreground font-mono">{e.nif}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs">{formatDate(e.fecha_validez)}</div>
                      <div className="text-xs font-medium text-amber-600">
                        {e.dias_para_vencer} dias
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  variant = 'default',
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'warning';
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold tracking-tight ${
              variant === 'warning' ? 'text-amber-600' : 'text-foreground'
            }`}
          >
            {value}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
