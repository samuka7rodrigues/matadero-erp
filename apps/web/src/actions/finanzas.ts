'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { fixFilenameEncoding } from '@/lib/utils';
import type { z } from 'zod';
import {
  clienteSchema,
  faturaSchema,
  cobroSchema,
  pagoSchema,
  despesaSchema,
  presupuestoSchema,
  nominaSchema,
  horaExtraSchema,
  type ClienteFormData,
  type FaturaFormData,
  type CobroFormData,
  type PagoFormData,
  type DespesaFormData,
  type PresupuestoFormData,
  type NominaFormData,
  type HoraExtraFormData,
} from '@/types/finanzas';
import type {
  Cliente,
  Fatura,
  FaturaCompleto,
  FaturaItem,
  Cobro,
  CobroCompleto,
  Pago,
  Despesa,
  DespesaCompleto,
  Presupuesto,
  PresupuestoCompleto,
  PresupuestoItem,
  Nomina,
  NominaCompleto,
  HoraExtra,
  HoraExtraCompleto,
  FlujoCajaRow,
  RentabilidadCliente,
  DocumentoFinanzas,
} from '@/types/database';

/**
 * Server Actions para o módulo Finanzas.
 * Permissões:
 * - Operativa (clientes, faturas, cobros, pagos, despesas, presupuestos): admin/financeiro (CRUD), auditor (leitura).
 * - Pessoal (nominas, horas_extras): admin/rh/financeiro (CRUD), auditor (leitura).
 */

async function requireRoles(
  supabase: ReturnType<typeof createClient>,
  roles: string[]
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!utilizador || !roles.includes(utilizador.role)) return null;
  return user;
}

const OPERATIVA_ROLES = ['admin', 'financeiro'];
const PESSOAL_ROLES = ['admin', 'rh', 'financeiro'];

function parseError(parsed: z.SafeParseReturnType<unknown, unknown>): string {
  if (parsed.success) return '';
  return `Dados inválidos: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`;
}

/* ============================================================
 * Clientes
 * ============================================================ */

export async function listClientes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .is('deleted_at', null)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Erro ao listar clientes:', error);
    return { data: [] as Cliente[], error: error.message };
  }
  return { data: (data || []) as Cliente[], error: null };
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Erro ao obter cliente:', error);
    return null;
  }
  return data as Cliente;
}

export async function createCliente(
  data: ClienteFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = clienteSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar clientes' };

  const { data: novo, error } = await supabase
    .from('clientes')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar cliente:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/finanzas/clientes`);
  return { success: true, id: (novo as Cliente).id };
}

export async function updateCliente(
  id: string,
  data: ClienteFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = clienteSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para editar clientes' };

  const { error } = await supabase
    .from('clientes')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    console.error('Erro ao actualizar cliente:', error);
    return { success: false, error: `Erro ao actualizar: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/finanzas/clientes`);
  revalidatePath(`/${locale}/finanzas/clientes/${id}`);
  return { success: true };
}

export async function deleteCliente(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar clientes' };

  const { error } = await supabase
    .from('clientes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar cliente:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/finanzas/clientes`);
  return { success: true };
}

/* ============================================================
 * Faturas + itens
 * ============================================================ */

export async function listFaturas() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('faturas')
    .select('*, clientes (nombre), empresas (nombre, nombre_comercial)')
    .is('deleted_at', null)
    .order('fecha_emision', { ascending: false });

  if (error) {
    console.error('Erro ao listar faturas:', error);
    return { data: [] as FaturaCompleto[], error: error.message };
  }
  return { data: (data || []) as FaturaCompleto[], error: null };
}

export async function getFatura(id: string): Promise<Fatura | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('faturas')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Erro ao obter fatura:', error);
    return null;
  }
  return data as Fatura;
}

export async function listFaturaItens(faturaId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('fatura_itens')
    .select('*')
    .eq('fatura_id', faturaId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao listar itens da fatura:', error);
    return { data: [] as FaturaItem[], error: error.message };
  }
  return { data: (data || []) as FaturaItem[], error: null };
}

function calcularTotais(itens: { importe: number; iva_pct: number }[]) {
  const base = itens.reduce((sum, i) => sum + Number(i.importe || 0), 0);
  const iva = itens.reduce(
    (sum, i) => sum + Number(i.importe || 0) * (Number(i.iva_pct || 0) / 100),
    0
  );
  return {
    base_imponible: Math.round(base * 100) / 100,
    iva: Math.round(iva * 100) / 100,
    total: Math.round((base + iva) * 100) / 100,
  };
}

export async function createFatura(
  data: FaturaFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = faturaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar faturas' };

  const { cliente_id, empresa_id, itens, ...rest } = parsed.data;
  const linhas: FaturaItem[] = itens.map((item) => ({
    ...item,
    importe: Math.round(item.quantidade * item.preco_unitario * 100) / 100,
    id: crypto.randomUUID(),
    fatura_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  const totais = calcularTotais(linhas);

  const { data: nova, error } = await supabase
    .from('faturas')
    .insert({ ...rest, cliente_id, empresa_id: empresa_id || null, ...totais })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar fatura:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const faturaId = (nova as Fatura).id;
  const { error: itensError } = await supabase.from('fatura_itens').insert(
    linhas.map((l) => ({
      fatura_id: faturaId,
      descricao: l.descricao,
      quantidade: l.quantidade,
      preco_unitario: l.preco_unitario,
      iva_pct: l.iva_pct,
      importe: l.importe,
    }))
  );

  if (itensError) {
    console.error('Erro ao guardar itens da fatura:', itensError);
    return { success: false, error: `Erro ao guardar itens: ${itensError.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/faturas`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true, id: faturaId };
}

export async function updateFaturaEstado(
  id: string,
  estado: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para actualizar faturas' };

  const { error } = await supabase
    .from('faturas')
    .update({ estado })
    .eq('id', id);

  if (error) {
    console.error('Erro ao actualizar estado da fatura:', error);
    return { success: false, error: `Erro ao actualizar: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/faturas`);
  revalidatePath(`/${locale}/faturas/${id}`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true };
}

export async function deleteFatura(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar faturas' };

  const { error } = await supabase
    .from('faturas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar fatura:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/faturas`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true };
}

/* ============================================================
 * Cobros
 * ============================================================ */

export async function listCobros() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cobros')
    .select('*, faturas (numero)')
    .is('deleted_at', null)
    .order('data', { ascending: false });

  if (error) {
    console.error('Erro ao listar cobros:', error);
    return { data: [] as CobroCompleto[], error: error.message };
  }
  return { data: (data || []) as CobroCompleto[], error: null };
}

export async function createCobro(
  data: CobroFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = cobroSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar cobros' };

  const { data: novo, error } = await supabase
    .from('cobros')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar cobro:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/cobros`);
  revalidatePath(`/${locale}/finanzas`);
  revalidatePath(`/${locale}/faturas`);
  return { success: true, id: (novo as Cobro).id };
}

export async function deleteCobro(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar cobros' };

  const { error } = await supabase
    .from('cobros')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar cobro:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/cobros`);
  revalidatePath(`/${locale}/finanzas`);
  revalidatePath(`/${locale}/faturas`);
  return { success: true };
}

/* ============================================================
 * Pagos
 * ============================================================ */

export async function listPagos() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .is('deleted_at', null)
    .order('data', { ascending: false });

  if (error) {
    console.error('Erro ao listar pagos:', error);
    return { data: [] as Pago[], error: error.message };
  }
  return { data: (data || []) as Pago[], error: null };
}

export async function createPago(
  data: PagoFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = pagoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar pagos' };

  const { data: novo, error } = await supabase
    .from('pagos')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar pago:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/pagos`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true, id: (novo as Pago).id };
}

export async function deletePago(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar pagos' };

  const { error } = await supabase
    .from('pagos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar pago:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/pagos`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true };
}

/* ============================================================
 * Despesas
 * ============================================================ */

export async function listDespesas() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('despesas')
    .select('*, clientes (nombre)')
    .is('deleted_at', null)
    .order('data', { ascending: false });

  if (error) {
    console.error('Erro ao listar despesas:', error);
    return { data: [] as DespesaCompleto[], error: error.message };
  }
  return { data: (data || []) as DespesaCompleto[], error: null };
}

export async function createDespesa(
  data: DespesaFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = despesaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar despesas' };

  const { data: novo, error } = await supabase
    .from('despesas')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar despesa:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/despesas`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true, id: (novo as Despesa).id };
}

export async function deleteDespesa(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar despesas' };

  const { error } = await supabase
    .from('despesas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar despesa:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/despesas`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true };
}

/* ============================================================
 * Presupuestos + itens
 * ============================================================ */

export async function listPresupuestos() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('presupuestos')
    .select('*, clientes (nombre)')
    .is('deleted_at', null)
    .order('data', { ascending: false });

  if (error) {
    console.error('Erro ao listar presupuestos:', error);
    return { data: [] as PresupuestoCompleto[], error: error.message };
  }
  return { data: (data || []) as PresupuestoCompleto[], error: null };
}

export async function getPresupuesto(id: string): Promise<Presupuesto | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('presupuestos')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Erro ao obter presupuesto:', error);
    return null;
  }
  return data as Presupuesto;
}

export async function listPresupuestoItens(presupuestoId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('presupuesto_itens')
    .select('*')
    .eq('presupuesto_id', presupuestoId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao listar itens do presupuesto:', error);
    return { data: [] as PresupuestoItem[], error: error.message };
  }
  return { data: (data || []) as PresupuestoItem[], error: null };
}

export async function createPresupuesto(
  data: PresupuestoFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = presupuestoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar presupuestos' };

  const { cliente_id, itens, ...rest } = parsed.data;
  const linhas: PresupuestoItem[] = itens.map((item) => ({
    ...item,
    importe: Math.round(item.quantidade * item.preco_unitario * 100) / 100,
    id: crypto.randomUUID(),
    presupuesto_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  const totais = calcularTotais(linhas);

  const { data: novo, error } = await supabase
    .from('presupuestos')
    .insert({ ...rest, cliente_id: cliente_id || null, ...totais })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar presupuesto:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const presupuestoId = (novo as Presupuesto).id;
  const { error: itensError } = await supabase.from('presupuesto_itens').insert(
    linhas.map((l) => ({
      presupuesto_id: presupuestoId,
      descricao: l.descricao,
      quantidade: l.quantidade,
      preco_unitario: l.preco_unitario,
      iva_pct: l.iva_pct,
      importe: l.importe,
    }))
  );

  if (itensError) {
    console.error('Erro ao guardar itens do presupuesto:', itensError);
    return { success: false, error: `Erro ao guardar itens: ${itensError.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/presupuestos`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true, id: presupuestoId };
}

export async function updatePresupuestoEstado(
  id: string,
  estado: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para actualizar presupuestos' };

  const { error } = await supabase
    .from('presupuestos')
    .update({ estado })
    .eq('id', id);

  if (error) {
    console.error('Erro ao actualizar estado do presupuesto:', error);
    return { success: false, error: `Erro ao actualizar: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/presupuestos`);
  revalidatePath(`/${locale}/presupuestos/${id}`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true };
}

export async function deletePresupuesto(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar presupuestos' };

  const { error } = await supabase
    .from('presupuestos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar presupuesto:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/presupuestos`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true };
}

/* ============================================================
 * Nóminas
 * ============================================================ */

export async function listNominas() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('nominas')
    .select('*, colaboradores (nombre, apellido1, apellido2)')
    .is('deleted_at', null)
    .order('ano', { ascending: false })
    .order('mes', { ascending: false });

  if (error) {
    console.error('Erro ao listar nóminas:', error);
    return { data: [] as NominaCompleto[], error: error.message };
  }
  return { data: (data || []) as NominaCompleto[], error: null };
}

export async function createNomina(
  data: NominaFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = nominaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, PESSOAL_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar nóminas' };

  const { colaborador_id, mes, ano, ...campos } = parsed.data;

  const { data: horas } = await supabase
    .from('horas_extras')
    .select('importe')
    .eq('colaborador_id', colaborador_id)
    .eq('estado', 'registrada')
    .is('deleted_at', null);

  const horasMes = (horas || []).reduce((s, h) => s + Number(h.importe || 0), 0);

  const salario_base = Number(campos.salario_base);
  const irpf = Number(campos.irpf);
  const seguranca_social = Number(campos.seguranca_social);
  const outras = Number(campos.outras_deducoes);
  const liquido =
    Math.round((salario_base + horasMes + Number(campos.complementos) - irpf - seguranca_social - outras) * 100) / 100;

  const { data: novo, error } = await supabase
    .from('nominas')
    .insert({
      ...campos,
      colaborador_id,
      mes,
      ano,
      horas_extra_importe: Math.round(horasMes * 100) / 100,
      liquido,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar nómina:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/rh/nominas`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true, id: (novo as Nomina).id };
}

export async function updateNominaEstado(
  id: string,
  estado: string,
  fecha_pago?: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, PESSOAL_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para actualizar nóminas' };

  const { error } = await supabase
    .from('nominas')
    .update({ estado, fecha_pago: fecha_pago ?? null })
    .eq('id', id);

  if (error) {
    console.error('Erro ao actualizar nómina:', error);
    return { success: false, error: `Erro ao actualizar: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/rh/nominas`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true };
}

export async function deleteNomina(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, PESSOAL_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar nóminas' };

  const { error } = await supabase
    .from('nominas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar nómina:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/rh/nominas`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true };
}

/* ============================================================
 * Horas extras
 * ============================================================ */

export async function listHorasExtras() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('horas_extras')
    .select('*, colaboradores (nombre, apellido1, apellido2)')
    .is('deleted_at', null)
    .order('data', { ascending: false });

  if (error) {
    console.error('Erro ao listar horas extras:', error);
    return { data: [] as HoraExtraCompleto[], error: error.message };
  }
  return { data: (data || []) as HoraExtraCompleto[], error: null };
}

export async function createHoraExtra(
  data: HoraExtraFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = horaExtraSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, PESSOAL_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar horas extras' };

  const importe = Math.round(parsed.data.horas * parsed.data.valor_hora * 100) / 100;

  const { data: novo, error } = await supabase
    .from('horas_extras')
    .insert({ ...parsed.data, importe })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar hora extra:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/rh/horas-extras`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true, id: (novo as HoraExtra).id };
}

export async function deleteHoraExtra(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, PESSOAL_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar horas extras' };

  const { error } = await supabase
    .from('horas_extras')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar hora extra:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/rh/horas-extras`);
  revalidatePath(`/${locale}/finanzas`);
  return { success: true };
}

/* ============================================================
 * Resumo / Flujo de caja / Rentabilidad
 * ============================================================ */

export async function getFlujoCaja() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('v_flujo_caja')
    .select('*')
    .limit(200);

  if (error) {
    console.error('Erro ao obter flujo de caja:', error);
    return { data: [] as FlujoCajaRow[], error: error.message };
  }
  return { data: (data || []) as FlujoCajaRow[], error: null };
}

export async function getRentabilidadClientes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('v_rentabilidad_cliente')
    .select('*')
    .limit(200);

  if (error) {
    console.error('Erro ao obter rentabilidad por cliente:', error);
    return { data: [] as RentabilidadCliente[], error: error.message };
  }
  return { data: (data || []) as RentabilidadCliente[], error: null };
}

export type ResumoFinanzas = {
  totalFacturado: number;
  totalCobrado: number;
  totalPagado: number;
  totalDespesas: number;
  saldo: number;
  faturasPendentes: number;
};

export async function getResumoFinanzas(): Promise<ResumoFinanzas> {
  const supabase = createClient();

  const { data: faturas } = await supabase
    .from('faturas')
    .select('total, estado')
    .is('deleted_at', null);

  const { data: cobros } = await supabase
    .from('cobros')
    .select('importe')
    .eq('estado', 'registrado')
    .is('deleted_at', null);

  const { data: pagos } = await supabase
    .from('pagos')
    .select('importe')
    .eq('estado', 'registrado')
    .is('deleted_at', null);

  const { data: despesas } = await supabase
    .from('despesas')
    .select('importe')
    .eq('estado', 'registrado')
    .is('deleted_at', null);

  const totalFacturado = (faturas || []).reduce(
    (s, f) => (f.estado === 'anulada' ? s : s + Number(f.total || 0)),
    0
  );
  const faturasPendentes = (faturas || []).filter(
    (f) => f.estado === 'borrador' || f.estado === 'emitida'
  ).length;
  const totalCobrado = (cobros || []).reduce((s, c) => s + Number(c.importe || 0), 0);
  const totalPagado = (pagos || []).reduce((s, p) => s + Number(p.importe || 0), 0);
  const totalDespesas = (despesas || []).reduce((s, d) => s + Number(d.importe || 0), 0);

  return {
    totalFacturado: Math.round(totalFacturado * 100) / 100,
    totalCobrado: Math.round(totalCobrado * 100) / 100,
    totalPagado: Math.round(totalPagado * 100) / 100,
    totalDespesas: Math.round(totalDespesas * 100) / 100,
    saldo: Math.round((totalCobrado - totalPagado - totalDespesas) * 100) / 100,
    faturasPendentes,
  };
}

/* ============================================================
 * Documentos anexos globais (Finanzas)
 * ============================================================ */

const DOCUMENTOS_BUCKET = 'documentos-finanzas';

/**
 * Lista os documentos anexos globais com URLs assinados (1h).
 * Acesso: admin/financeiro/auditor (leitura via RLS).
 */
export async function listDocumentosFinanzas(): Promise<{
  data: Array<DocumentoFinanzas & { url: string | null }>;
  error?: string;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('documentos_finanzas')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  const withUrl = await Promise.all(
    (data || []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from(DOCUMENTOS_BUCKET)
        .createSignedUrl(doc.archivo_url, 3600);
      return { ...doc, nombre: fixFilenameEncoding(doc.nombre), url: signed?.signedUrl || null };
    })
  );

  return { data: withUrl };
}

/**
 * Faz upload de um documento anexo global (storage + registo na BD).
 * Recebe um FormData com: file, categoria, descripcion, expires_at.
 */
export async function uploadDocumentoFinanzas(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para gerir documentos' };

  const file = formData.get('file') as File | null;
  const categoria = (formData.get('categoria') as string) || 'outro';
  const descripcion = (formData.get('descripcion') as string) || null;
  const expiresAt = (formData.get('expires_at') as string) || null;

  if (!file || file.size === 0) {
    return { success: false, error: 'Seleciona um ficheiro para carregar' };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { success: false, error: 'Ficheiro demasiado grande (máximo 20 MB)' };
  }

  const safeName = fixFilenameEncoding(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `global/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTOS_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Erro no upload:', uploadError);
    return { success: false, error: `Erro no upload: ${uploadError.message}` };
  }

  const { error: insertError } = await supabase
    .from('documentos_finanzas')
    .insert({
      categoria,
      nombre: fixFilenameEncoding(file.name),
      descripcion,
      archivo_url: path,
      archivo_size: file.size,
      mime_type: file.type || null,
      uploaded_by: user.id,
      expires_at: expiresAt,
    });

  if (insertError) {
    await supabase.storage.from(DOCUMENTOS_BUCKET).remove([path]);
    console.error('Erro ao registar documento:', insertError);
    return { success: false, error: `Erro ao registar documento: ${insertError.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/finanzas`);
  return { success: true };
}

/**
 * Elimina um documento (BD + ficheiro no storage).
 */
export async function eliminarDocumentoFinanzas(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, OPERATIVA_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para gerir documentos' };

  const { data: doc } = await supabase
    .from('documentos_finanzas')
    .select('archivo_url')
    .eq('id', id)
    .single();

  if (!doc) return { success: false, error: 'Documento não encontrado' };

  const { error } = await supabase
    .from('documentos_finanzas')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: `Erro ao eliminar: ${error.message}` };
  }

  if (doc.archivo_url) {
    await supabase.storage.from(DOCUMENTOS_BUCKET).remove([doc.archivo_url]);
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/finanzas`);
  return { success: true };
}
