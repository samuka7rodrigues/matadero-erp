'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import {
  configuracaoSchema,
  feriadoSchema,
  type ConfiguracaoFormData,
  type FeriadoFormData,
} from '@/types/configuracao';

export interface ConfiguracaoRow extends ConfiguracaoFormData {
  id: number;
  updated_at: string | null;
  updated_by: string | null;
}

export interface FeriadoRow {
  id: string;
  fecha: string;
  nombre: string;
  activo: boolean;
}

async function requireRole(
  supabase: ReturnType<typeof createClient>,
  roles: string[]
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!utilizador || !roles.includes(utilizador.role)) return null;
  return user;
}

export async function getConfiguracao(): Promise<ConfiguracaoRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('configuracoes')
    .select('*')
    .eq('id', 1)
    .single();

  if (!data) return null;
  return data as ConfiguracaoRow;
}

export async function atualizarConfiguracao(
  data: ConfiguracaoFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = configuracaoSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireRole(supabase, ['admin']);
  if (!user) return { success: false, error: 'Sem permissão para alterar configurações' };

  const { error } = await supabase
    .from('configuracoes')
    .upsert({
      id: 1,
      ...parsed.data,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Erro ao atualizar configurações:', error);
    return { success: false, error: `Erro ao guardar: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/configuracoes`);
  return { success: true };
}

export async function listFeriados(): Promise<FeriadoRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('feriados')
    .select('id, fecha, nombre, activo')
    .order('fecha');

  return (data || []) as FeriadoRow[];
}

export async function adicionarFeriado(
  data: FeriadoFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = feriadoSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireRole(supabase, ['admin', 'rh']);
  if (!user) return { success: false, error: 'Sem permissão para gerir feriados' };

  const { error } = await supabase.from('feriados').insert({
    fecha: parsed.data.fecha,
    nombre: parsed.data.nombre,
  });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe um feriado nesta data' };
    }
    return { success: false, error: `Erro ao adicionar: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/configuracoes`);
  return { success: true };
}

export async function eliminarFeriado(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRole(supabase, ['admin', 'rh']);
  if (!user) return { success: false, error: 'Sem permissão para gerir feriados' };

  const { error } = await supabase.from('feriados').delete().eq('id', id);

  if (error) {
    return { success: false, error: 'Erro ao eliminar feriado' };
  }

  revalidatePath(`/${await getLocale()}/configuracoes`);
  return { success: true };
}

const TABELAS_EXPORT: string[] = [
  'configuracoes',
  'feriados',
  'utilizadores',
  'permissoes_menus',
  'empresas',
  'departamentos',
  'colaboradores',
  'contratos',
  'contratos_documentos',
  'contratos_firmas',
  'alojamientos',
  'habitaciones',
  'ocupacion',
  'contratos_arrendamento',
  'consumos',
  'inventario',
  'incidencias',
  'fotografias',
  'clientes',
  'faturas',
  'fatura_itens',
  'cobros',
  'pagos',
  'despesas',
  'presupuestos',
  'presupuesto_itens',
  'nominas',
  'horas_extras',
  'ferias',
  'ausencias',
  'cursos',
  'certificados',
  'exames_medicos',
  'entregas_epi',
  'advertencias',
  'avaliacoes',
  'marcacoes_ponto',
  'turnos',
  'flota_vehiculos',
  'flota_conductores',
  'flota_seguros',
  'flota_itv',
  'flota_mantenimiento',
  'flota_combustible',
  'flota_kilometraje',
  'flota_multas',
  'documentos',
  'documentos_colaborador',
  'documentos_finanzas',
];

export async function exportarDados(): Promise<{
  success: boolean;
  error?: string;
  json?: string;
}> {
  const supabase = createClient();
  const user = await requireRole(supabase, ['admin']);
  if (!user) return { success: false, error: 'Sem permissão para exportar dados' };

  const dump: Record<string, unknown[]> = {};
  for (const tabela of TABELAS_EXPORT) {
    try {
      const { data } = await supabase.from(tabela).select('*');
      dump[tabela] = data || [];
    } catch {
      dump[tabela] = [];
    }
  }

  return { success: true, json: JSON.stringify(dump, null, 2) };
}

export async function limparDadosTeste(): Promise<{
  success: boolean;
  error?: string;
  eliminados?: number;
}> {
  const supabase = createClient();
  const user = await requireRole(supabase, ['admin']);
  if (!user) return { success: false, error: 'Sem permissão para limpar dados' };

  const now = new Date().toISOString();
  let total = 0;

  // Colaboradores de teste (nome/apelido/email/nif com "teste")
  const { data: cols } = await supabase
    .from('colaboradores')
    .select('id')
    .or('nombre.ilike.%teste%,apellido1.ilike.%teste%,apellido2.ilike.%teste%,email.ilike.%teste%,nif.ilike.%teste%')
    .is('deleted_at', null);

  const colIds = (cols || []).map((c) => c.id);
  if (colIds.length > 0) {
    const { error } = await supabase
      .from('colaboradores')
      .update({ deleted_at: now })
      .in('id', colIds);
    if (!error) total += colIds.length;
  }

  // Clientes de teste
  const { data: clis } = await supabase
    .from('clientes')
    .select('id')
    .or('nombre.ilike.%teste%,email.ilike.%teste%')
    .is('deleted_at', null);

  const cliIds = (clis || []).map((c) => c.id);

  // Faturas de clientes de teste
  const fatIds: string[] = [];
  if (cliIds.length > 0) {
    const { data: fats } = await supabase
      .from('faturas')
      .select('id')
      .in('cliente_id', cliIds)
      .is('deleted_at', null);
    if (fats && fats.length > 0) {
      const { error } = await supabase
        .from('faturas')
        .update({ deleted_at: now })
        .in('id', fats.map((f) => f.id));
      if (!error) {
        total += fats.length;
        fatIds.push(...fats.map((f) => f.id));
      }
    }
  }

  if (cliIds.length > 0) {
    const { error } = await supabase
      .from('clientes')
      .update({ deleted_at: now })
      .in('id', cliIds);
    if (!error) total += cliIds.length;
  }

  revalidatePath(`/${await getLocale()}/configuracoes`);
  return { success: true, eliminados: total };
}
