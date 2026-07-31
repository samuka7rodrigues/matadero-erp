import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-shell';
import {
  DashboardClient,
  type ContratoExpirar,
  type ExameVencer,
} from '@/components/dashboard/dashboard-client';

/**
 * Server Component — faz queries ao Supabase.
 * Passa os dados (já serializados) para o DashboardClient (Client Component).
 */
export default async function DashboardPage() {
  const supabase = createClient();

  // Total colaboradores ativos
  const { count: totalAtivos } = await supabase
    .from('colaboradores')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'ativo')
    .is('deleted_at', null);

  // Admitidos este mês
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const { count: admitidosMes } = await supabase
    .from('colaboradores')
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

  // Serializa para passar ao Client Component (sem Date objects, sem any)
  const contratosSafe: ContratoExpirar[] = (contratosExpirar || []).map((c: any) => ({
    id: c.id,
    nombre: c.nombre ?? '',
    apellido1: c.apellido1 ?? '',
    nif: c.nif ?? '',
    fecha_fin_contrato: c.fecha_fin_contrato ?? '',
    dias_para_fim: typeof c.dias_para_fim === 'number' ? c.dias_para_fim : 0,
  }));

  const examesSafe: ExameVencer[] = (examesVencer || []).map((e: any) => ({
    id: e.id,
    nombre: e.nombre ?? '',
    apellido1: e.apellido1 ?? '',
    nif: e.nif ?? '',
    fecha_validez: e.fecha_validez ?? '',
    dias_para_vencer: typeof e.dias_para_vencer === 'number' ? e.dias_para_vencer : 0,
  }));

  return (
    <AppShell>
      <DashboardClient
        totalAtivos={totalAtivos || 0}
        admitidosMes={admitidosMes || 0}
        contratosExpirar={contratosSafe}
        examesVencer={examesSafe}
      />
    </AppShell>
  );
}