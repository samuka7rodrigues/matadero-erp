import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-shell';
import {
  DashboardClient,
  type ContratoExpirar,
  type ExameVencer,
  type AgendaItem,
} from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const supabase = createClient();
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. KPIs
  const { count: totalAtivos } = await supabase
    .from('colaboradores')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'ativo')
    .is('deleted_at', null);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const { count: admitidosMes } = await supabase
    .from('colaboradores')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_admision', startOfMonth.toISOString().split('T')[0])
    .is('deleted_at', null);

  const { count: alojamentosOcupados } = await supabase
    .from('alojamiento_habitaciones')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'ocupada');

  const { count: faturasPendentes } = await supabase
    .from('faturas')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'borrador');

  const { count: flotaAtiva } = await supabase
    .from('flota_vehiculos')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'ativo');

  // 2. Alertas
  const { data: contratosExpirar } = await supabase
    .from('v_contratos_a_expirar')
    .select('*')
    .limit(10);

  const { data: examesVencer } = await supabase
    .from('v_exames_a_vencer')
    .select('*')
    .limit(10);

  // 3. Agenda Operacional (Férias ativas, Cursos programados, Inspeções/ITV de veículos, Ocupações)
  const agenda: AgendaItem[] = [];

  // Férias
  const { data: feriasData } = await supabase
    .from('ferias')
    .select('id, data_inicio, data_fim, estado, colaboradores(nombre, apellido1)')
    .gte('data_fim', todayStr)
    .limit(5);

  if (feriasData) {
    feriasData.forEach((f: any) => {
      const nome = f.colaboradores ? `${f.colaboradores.nombre || ''} ${f.colaboradores.apellido1 || ''}`.trim() : 'Colaborador';
      agenda.push({
        id: f.id,
        tipo: 'ferias',
        titulo: `Férias: ${nome}`,
        data: f.data_inicio,
        dataFim: f.data_fim,
        estado: f.estado,
        link: '/rh/ferias',
      });
    });
  }

  // Cursos / Formação
  const { data: cursosData } = await supabase
    .from('cursos')
    .select('id, nombre, data_inicio, estado, colaboradores(nombre, apellido1)')
    .gte('data_inicio', todayStr)
    .limit(5);

  if (cursosData) {
    cursosData.forEach((c: any) => {
      const nome = c.colaboradores ? `${c.colaboradores.nombre || ''} ${c.colaboradores.apellido1 || ''}`.trim() : '';
      agenda.push({
        id: c.id,
        tipo: 'curso',
        titulo: `Curso: ${c.nombre}${nome ? ` (${nome})` : ''}`,
        data: c.data_inicio,
        estado: c.estado,
        link: '/rh/cursos',
      });
    });
  }

  // ITV / Inspeções de Frota
  const { data: itvData } = await supabase
    .from('flota_itv')
    .select('id, fecha_proxima, resultado, flota_vehiculos(matricula, marca, modelo)')
    .gte('fecha_proxima', todayStr)
    .limit(5);

  if (itvData) {
    itvData.forEach((i: any) => {
      const veh = i.flota_vehiculos ? `${i.flota_vehiculos.marca || ''} ${i.flota_vehiculos.modelo || ''} (${i.flota_vehiculos.matricula})`.trim() : 'Veículo';
      agenda.push({
        id: i.id,
        tipo: 'itv',
        titulo: `ITV / Inspeção: ${veh}`,
        data: i.fecha_proxima,
        estado: i.resultado || 'pendente',
        link: '/flota/itv',
      });
    });
  }

  // Ordena agenda por data mais próxima
  agenda.sort((a, b) => (a.data > b.data ? 1 : -1));

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
        alojamentosOcupados={alojamentosOcupados || 0}
        faturasPendentes={faturasPendentes || 0}
        flotaAtiva={flotaAtiva || 0}
        contratosExpirar={contratosSafe}
        examesVencer={examesSafe}
        agenda={agenda}
      />
    </AppShell>
  );
}
