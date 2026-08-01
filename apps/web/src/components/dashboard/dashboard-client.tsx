'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserPlus, FileX, HeartPulse } from 'lucide-react';

// =====================================================
// Tipos serializados (compatíveis com serialização Next.js Server → Client)
// =====================================================

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

interface DashboardClientProps {
  totalAtivos: number;
  admitidosMes: number;
  contratosExpirar: ContratoExpirar[];
  examesVencer: ExameVencer[];
}

// =====================================================
// Componente principal
// =====================================================

export function DashboardClient({
  totalAtivos,
  admitidosMes,
  contratosExpirar,
  examesVencer,
}: DashboardClientProps) {
  const t = useTranslations('Dashboard');

  return (
    <div className="space-y-6">
      {/* Hero azul */}
      <div className="rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 p-6 text-white shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-blue-100">{t('subtitle')}</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t('kpis.totalColaboradores')}
          value={totalAtivos}
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          title={t('kpis.admitidosMes')}
          value={admitidosMes}
          icon={<UserPlus className="h-4 w-4" />}
        />
        <KpiCard
          title={t('kpis.contratosFim')}
          value={contratosExpirar.length}
          icon={<FileX className="h-4 w-4" />}
          variant={contratosExpirar.length > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          title={t('kpis.examesVencer')}
          value={examesVencer.length}
          icon={<HeartPulse className="h-4 w-4" />}
          variant={examesVencer.length > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Alertas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-blue-100 bg-blue-50/60">
            <CardTitle className="text-base text-blue-800">Contratos a expirar (60 días)</CardTitle>
            <CardDescription>Colaboradores com contrato a terminar</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {contratosExpirar.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem contratos a expirar</p>
            ) : (
              <ul className="space-y-2">
                {contratosExpirar.map((c) => (
                  <li
                    key={c.id}
                    className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
                  >
                    <div>
                      <div className="font-medium">
                        {c.nombre} {c.apellido1}
                      </div>
                      <div className="text-xs text-muted-foreground">{c.nif}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs">{c.fecha_fin_contrato}</div>
                      <div className="text-xs text-amber-600">{c.dias_para_fim} días</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-blue-100 bg-blue-50/60">
            <CardTitle className="text-base text-blue-800">Exames médicos a vencer</CardTitle>
            <CardDescription>Próximos 30 días</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {examesVencer.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos os exames em dia</p>
            ) : (
              <ul className="space-y-2">
                {examesVencer.map((e) => (
                  <li
                    key={e.id}
                    className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
                  >
                    <div>
                      <div className="font-medium">
                        {e.nombre} {e.apellido1}
                      </div>
                      <div className="text-xs text-muted-foreground">{e.nif}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs">{e.fecha_validez}</div>
                      <div className="text-xs text-amber-600">
                        {e.dias_para_vencer} días
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

// =====================================================
// KPI Card (subcomponente) — tema azul
// =====================================================

function KpiCard({
  title,
  value,
  icon,
  variant = 'default',
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'warning';
}) {
  return (
    <Card className="border-blue-100">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`text-3xl font-bold ${
            variant === 'warning' ? 'text-amber-600' : 'text-blue-700'
          }`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
