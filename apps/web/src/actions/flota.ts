'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import type {
  FlotaVehiculo,
  FlotaConductor,
  FlotaITV,
  FlotaSeguro,
  FlotaMantenimiento,
  FlotaCombustible,
  FlotaKilometraje,
  FlotaMulta,
} from '@/types/database';

/**
 * Server Actions do módulo Flota.
 * Permissões:
 * - Admin/RH: gestão total (CRUD).
 * - Financeiro/Auditor: leitura (via RLS).
 * As listas usam apenas SELECT (RLS filtra); as escritas exigem
 * role admin/rh.
 */

async function requireGestor(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!utilizador || !['admin', 'rh'].includes(utilizador.role)) return null;
  return user;
}

type Result = { success: boolean; error?: string };

async function insertRow(table: string, values: Record<string, unknown>): Promise<Result> {
  const supabase = createClient();
  const user = await requireGestor(supabase);
  if (!user) return { success: false, error: 'Sem permissão para editar a flota' };

  const { error } = await supabase.from(table).insert(values);
  if (error) {
    console.error(`Erro ao criar ${table}:`, error);
    return { success: false, error: `Erro ao guardar: ${error.message}` };
  }
  return { success: true };
}

async function deleteRow(table: string, id: string, path: string): Promise<Result> {
  const supabase = createClient();
  const user = await requireGestor(supabase);
  if (!user) return { success: false, error: 'Sem permissão para editar a flota' };

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error(`Erro ao eliminar ${table}:`, error);
    return { success: false, error: 'Erro ao eliminar' };
  }
  revalidatePath(`/${await getLocale()}${path}`);
  return { success: true };
}

async function updateEstado(table: string, id: string, estado: string, path: string): Promise<Result> {
  const supabase = createClient();
  const user = await requireGestor(supabase);
  if (!user) return { success: false, error: 'Sem permissão para editar a flota' };

  const { error } = await supabase.from(table).update({ estado }).eq('id', id);
  if (error) {
    console.error(`Erro ao atualizar ${table}:`, error);
    return { success: false, error: 'Erro ao atualizar' };
  }
  revalidatePath(`/${await getLocale()}${path}`);
  return { success: true };
}

/* ============================================================
 * Veículos
 * ============================================================ */

export async function listVehiculos(): Promise<FlotaVehiculo[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('flota_vehiculos')
    .select('*')
    .order('matricula', { ascending: true });
  return (data || []) as FlotaVehiculo[];
}

export async function createVehiculo(values: {
  matricula: string;
  marca: string;
  modelo: string;
  tipo: string;
  ano: number | null;
  km_actuales: number | null;
  estado: string;
  fecha_compra: string | null;
  observacoes: string | null;
}): Promise<Result> {
  if (!values.matricula || !values.marca || !values.modelo) {
    return { success: false, error: 'Matrícula, marca e modelo são obrigatórios' };
  }
  const result = await insertRow('flota_vehiculos', values);
  if (result.success) revalidatePath(`/${await getLocale()}/flota/vehiculos`);
  return result;
}

export async function updateVehiculo(
  id: string,
  values: Partial<{
    matricula: string;
    marca: string;
    modelo: string;
    tipo: string;
    ano: number | null;
    km_actuales: number | null;
    estado: string;
    fecha_compra: string | null;
    observacoes: string | null;
  }>
): Promise<Result> {
  const supabase = createClient();
  const user = await requireGestor(supabase);
  if (!user) return { success: false, error: 'Sem permissão para editar a flota' };

  const { error } = await supabase.from('flota_vehiculos').update(values).eq('id', id);
  if (error) {
    console.error('Erro ao atualizar veículo:', error);
    return { success: false, error: 'Erro ao atualizar' };
  }
  revalidatePath(`/${await getLocale()}/flota/vehiculos`);
  return { success: true };
}

export const deleteVehiculo = (id: string) => deleteRow('flota_vehiculos', id, '/flota/vehiculos');

/* ============================================================
 * Condutores (atribuição veículo <-> colaborador)
 * ============================================================ */

export interface FlotaConductorCompleto extends FlotaConductor {
  vehiculos?: Pick<FlotaVehiculo, 'id' | 'matricula' | 'marca' | 'modelo'> | null;
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

export async function listConductores(): Promise<FlotaConductorCompleto[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('flota_conductores')
    .select(
      `*, vehiculos:vehiculo_id (id, matricula, marca, modelo), colaboradores (nombre, apellido1, apellido2)`
    )
    .order('asignado_desde', { ascending: false });
  return (data || []) as FlotaConductorCompleto[];
}

export async function createConductor(values: {
  vehiculo_id: string;
  colaborador_id: string;
  asignado_desde: string;
  asignado_hasta: string | null;
  principal: boolean;
}): Promise<Result> {
  if (!values.vehiculo_id || !values.colaborador_id) {
    return { success: false, error: 'Veículo e condutor são obrigatórios' };
  }
  const result = await insertRow('flota_conductores', values);
  if (result.success) revalidatePath(`/${await getLocale()}/flota/conductores`);
  return result;
}

export const deleteConductor = (id: string) => deleteRow('flota_conductores', id, '/flota/conductores');

/* ============================================================
 * ITV
 * ============================================================ */

export interface FlotaITVCompleto extends FlotaITV {
  vehiculos?: Pick<FlotaVehiculo, 'id' | 'matricula' | 'marca' | 'modelo'> | null;
}

export async function listITVs(): Promise<FlotaITVCompleto[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('flota_itv')
    .select(`*, vehiculos:vehiculo_id (id, matricula, marca, modelo)`)
    .order('fecha', { ascending: false });
  return (data || []) as FlotaITVCompleto[];
}

export async function createITV(values: {
  vehiculo_id: string;
  fecha: string;
  fecha_validez: string | null;
  resultado: string;
  centro: string | null;
  observacoes: string | null;
}): Promise<Result> {
  if (!values.vehiculo_id || !values.fecha) {
    return { success: false, error: 'Veículo e data são obrigatórios' };
  }
  const result = await insertRow('flota_itv', values);
  if (result.success) revalidatePath(`/${await getLocale()}/flota/itv`);
  return result;
}

export const updateITVResultado = (id: string, resultado: string) =>
  updateEstado('flota_itv', id, resultado, '/flota/itv');

export const deleteITV = (id: string) => deleteRow('flota_itv', id, '/flota/itv');

/* ============================================================
 * Seguros
 * ============================================================ */

export interface FlotaSeguroCompleto extends FlotaSeguro {
  vehiculos?: Pick<FlotaVehiculo, 'id' | 'matricula' | 'marca' | 'modelo'> | null;
}

export async function listSeguros(): Promise<FlotaSeguroCompleto[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('flota_seguros')
    .select(`*, vehiculos:vehiculo_id (id, matricula, marca, modelo)`)
    .order('fecha_fin', { ascending: false });
  return (data || []) as FlotaSeguroCompleto[];
}

export async function createSeguro(values: {
  vehiculo_id: string;
  compania: string;
  poliza: string | null;
  tipo: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  importe: number | null;
  estado: string;
  observacoes: string | null;
}): Promise<Result> {
  if (!values.vehiculo_id || !values.compania) {
    return { success: false, error: 'Veículo e companhia são obrigatórios' };
  }
  const result = await insertRow('flota_seguros', values);
  if (result.success) revalidatePath(`/${await getLocale()}/flota/seguros`);
  return result;
}

export const updateSeguroEstado = (id: string, estado: string) =>
  updateEstado('flota_seguros', id, estado, '/flota/seguros');

export const deleteSeguro = (id: string) => deleteRow('flota_seguros', id, '/flota/seguros');

/* ============================================================
 * Mantenimiento
 * ============================================================ */

export interface FlotaMantenimientoCompleto extends FlotaMantenimiento {
  vehiculos?: Pick<FlotaVehiculo, 'id' | 'matricula' | 'marca' | 'modelo'> | null;
}

export async function listMantenimientos(): Promise<FlotaMantenimientoCompleto[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('flota_mantenimiento')
    .select(`*, vehiculos:vehiculo_id (id, matricula, marca, modelo)`)
    .order('fecha', { ascending: false });
  return (data || []) as FlotaMantenimientoCompleto[];
}

export async function createMantenimiento(values: {
  vehiculo_id: string;
  fecha: string;
  tipo: string;
  descricao: string;
  km: number | null;
  importe: number | null;
  proveedor: string | null;
  observacoes: string | null;
}): Promise<Result> {
  if (!values.vehiculo_id || !values.descricao) {
    return { success: false, error: 'Veículo e descrição são obrigatórios' };
  }
  const result = await insertRow('flota_mantenimiento', values);
  if (result.success) revalidatePath(`/${await getLocale()}/flota/mantenimiento`);
  return result;
}

export const deleteMantenimiento = (id: string) =>
  deleteRow('flota_mantenimiento', id, '/flota/mantenimiento');

/* ============================================================
 * Combustible
 * ============================================================ */

export interface FlotaCombustibleCompleto extends FlotaCombustible {
  vehiculos?: Pick<FlotaVehiculo, 'id' | 'matricula' | 'marca' | 'modelo'> | null;
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

export async function listCombustible(): Promise<FlotaCombustibleCompleto[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('flota_combustible')
    .select(
      `*, vehiculos:vehiculo_id (id, matricula, marca, modelo), colaboradores (nombre, apellido1, apellido2)`
    )
    .order('fecha', { ascending: false });
  return (data || []) as FlotaCombustibleCompleto[];
}

export async function createCombustible(values: {
  vehiculo_id: string;
  fecha: string;
  litros: number;
  importe: number;
  km: number | null;
  tipo: string;
  colaborador_id: string | null;
  observacoes: string | null;
}): Promise<Result> {
  if (!values.vehiculo_id || !values.litros || !values.importe) {
    return { success: false, error: 'Veículo, litros e importe são obrigatórios' };
  }
  const result = await insertRow('flota_combustible', values);
  if (result.success) revalidatePath(`/${await getLocale()}/flota/combustible`);
  return result;
}

export const deleteCombustible = (id: string) =>
  deleteRow('flota_combustible', id, '/flota/combustible');

/* ============================================================
 * Kilometraje
 * ============================================================ */

export interface FlotaKilometrajeCompleto extends FlotaKilometraje {
  vehiculos?: Pick<FlotaVehiculo, 'id' | 'matricula' | 'marca' | 'modelo'> | null;
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

export async function listKilometrajes(): Promise<FlotaKilometrajeCompleto[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('flota_kilometraje')
    .select(
      `*, vehiculos:vehiculo_id (id, matricula, marca, modelo), colaboradores (nombre, apellido1, apellido2)`
    )
    .order('fecha', { ascending: false });
  return (data || []) as FlotaKilometrajeCompleto[];
}

export async function createKilometraje(values: {
  vehiculo_id: string;
  fecha: string;
  km: number;
  colaborador_id: string | null;
  observacoes: string | null;
}): Promise<Result> {
  if (!values.vehiculo_id || values.km === null || values.km === undefined) {
    return { success: false, error: 'Veículo e quilómetros são obrigatórios' };
  }
  const result = await insertRow('flota_kilometraje', values);
  if (result.success) revalidatePath(`/${await getLocale()}/flota/kilometraje`);
  return result;
}

export const deleteKilometraje = (id: string) =>
  deleteRow('flota_kilometraje', id, '/flota/kilometraje');

/* ============================================================
 * Multas
 * ============================================================ */

export interface FlotaMultaCompleto extends FlotaMulta {
  vehiculos?: Pick<FlotaVehiculo, 'id' | 'matricula' | 'marca' | 'modelo'> | null;
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

export async function listMultas(): Promise<FlotaMultaCompleto[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('flota_multas')
    .select(
      `*, vehiculos:vehiculo_id (id, matricula, marca, modelo), colaboradores (nombre, apellido1, apellido2)`
    )
    .order('fecha', { ascending: false });
  return (data || []) as FlotaMultaCompleto[];
}

export async function createMulta(values: {
  vehiculo_id: string;
  colaborador_id: string | null;
  fecha: string;
  importe: number;
  descricao: string | null;
  lugar: string | null;
  estado: string;
  observacoes: string | null;
}): Promise<Result> {
  if (!values.vehiculo_id || !values.fecha || values.importe === null || values.importe === undefined) {
    return { success: false, error: 'Veículo, data e importe são obrigatórios' };
  }
  const result = await insertRow('flota_multas', values);
  if (result.success) revalidatePath(`/${await getLocale()}/flota/multas`);
  return result;
}

export const updateMultaEstado = (id: string, estado: string) =>
  updateEstado('flota_multas', id, estado, '/flota/multas');

export const deleteMulta = (id: string) => deleteRow('flota_multas', id, '/flota/multas');
