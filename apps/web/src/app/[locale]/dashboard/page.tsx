import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserPlus, FileX, HeartPulse } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useTranslations } from 'next-intl';

export default async function DashboardPage() {
  const supabase = createClient();

  // Total funcionários ativos
  const { count: totalAtivos } = await supabase
    .from('funcionarios')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'ativo')
    .is('deleted_at', null);

  // Admitidos este mês
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const { count: admitidosMes } = await supabase
    .from('funcionarios')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_admision', startOfMonth.toISOString().split('T')[0])
    .is('deleted_at', null);

  // Contratos a expirar (view)
  const { data: contratosExpirar } = await supabase
    .from('v_contratos_a_expirar')
    .select('*')
    .limit(10);

  // Exames médicos a vencer (view)
  const { data: examesVencer } = await supabase
    .from('v_exames_a_vencer')
    .select('*')
    .limit(10);

  return (
    <AppShell>
      <DashboardClient
        totalAtivos={totalAtivos || 0}
        admitidosMes={admitidosMes || 0}
        contratosExpirar={contratosExpirar || []}
        examesVencer={examesVencer || []}
      />
    </AppShell>
  );
}

interface DashboardClientProps {
  totalAtivos: number;
  admitidosMes: number;
  contratosExpirar: any[];
  examesVencer: any[];
}

function DashboardClient({ totalAtivos, admitidosMes, contratosExpirar, examesVencer }: DashboardClientProps) {
  const t = useTranslations('Dashboard');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t('kpis.totalFuncionarios')}
          value={totalAtivos}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title={t('kpis.admitidosMes')}
          value={admitidosMes}
          icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title={t('kpis.contratosFim')}
          value={contratosExpirar.length}
          icon={<FileX className="h-4 w-4 text-muted-foreground" />}
          variant={contratosExpirar.length > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          title={t('kpis.examesVencer')}
          value={examesVencer.length}
          icon={<HeartPulse className="h-4 w-4 text-muted-foreground" />}
          variant={examesVencer.length > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Alertas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contratos a expirar (60 días)</CardTitle>
            <CardDescription>Funcionários com contrato a terminar</CardDescription>
          </CardHeader>
          <CardContent>
            {contratosExpirar.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem contratos a expirar</p>
            ) : (
              <ul className="space-y-2">
                {contratosExpirar.map((c: any) => (
                  <li key={c.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                    <div>
                      <div className="font-medium">{c.nombre} {c.apellido1}</div>
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
          <CardHeader>
            <CardTitle className="text-base">Exames médicos a vencer</CardTitle>
            <CardDescription>Próximos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            {examesVencer.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos os exames em dia</p>
            ) : (
              <ul className="space-y-2">
                {examesVencer.map((e: any) => (
                  <li key={e.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                    <div>
                      <div className="font-medium">{e.nombre} {e.apellido1}</div>
                      <div className="text-xs text-muted-foreground">{e.nif}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs">{e.fecha_validez}</div>
                      <div className="text-xs text-amber-600">{e.dias_para_vencer} días</div>
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
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'default' | 'warning';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${variant === 'warning' ? 'text-amber-600' : ''}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
