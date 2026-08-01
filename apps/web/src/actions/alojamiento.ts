'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import {
  alojamientoSchema,
  habitacionSchema,
  ocupacionSchema,
  type AlojamientoFormData,
  type HabitacionFormData,
  type OcupacionFormData,
} from '@/types/alojamiento';
import type {
  Alojamiento,
  AlojamientoCompleto,
  Habitacion,
  OcupacionCompleto,
} from '@/types/database';

/**
 * Server Actions para o cadastro de alojamientos (viviendas).
 * Permissões: admin/rh (CRUD completo), financeiro/auditor (leitura).
 */

export async function requireAdminOrRh(supabase: ReturnType<typeof createClient>) {
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

export async function listAlojamientos() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('alojamientos')
    .select('*, empresas:empresa_id (nombre)')
    .is('deleted_at', null)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Erro ao listar alojamientos:', error);
    return { data: [] as AlojamientoCompleto[], error: error.message };
  }

  return { data: (data || []) as AlojamientoCompleto[], error: null };
}

export async function getAlojamiento(id: string): Promise<Alojamiento | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('alojamientos')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Erro ao obter alojamiento:', error);
    return null;
  }

  return data as Alojamiento;
}

export async function createAlojamiento(
  data: AlojamientoFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = alojamientoSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para criar alojamientos' };

  const { data: novo, error } = await supabase
    .from('alojamientos')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar alojamiento:', error);
    return {
      success: false,
      error: `Erro ao guardar na base de dados: ${error.message}${error.details ? ` (${error.details})` : ''}`,
    };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/alojamientos`);
  return { success: true, id: (novo as Alojamiento).id };
}

export async function updateAlojamiento(
  id: string,
  data: AlojamientoFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = alojamientoSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para editar alojamientos' };

  const { error } = await supabase
    .from('alojamientos')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    console.error('Erro ao actualizar alojamiento:', error);
    return { success: false, error: `Erro ao actualizar: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/alojamientos`);
  revalidatePath(`/${locale}/alojamientos/${id}`);
  return { success: true };
}

export async function deleteAlojamiento(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para eliminar alojamientos' };

  const { error } = await supabase
    .from('alojamientos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar alojamiento:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/alojamientos`);
  return { success: true };
}

/* ============================================================
 * Habitaciones
 * ============================================================ */

export async function listarHabitaciones(alojamientoId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('habitaciones')
    .select('*')
    .eq('alojamiento_id', alojamientoId)
    .is('deleted_at', null)
    .order('numero', { ascending: true });

  if (error) {
    console.error('Erro ao listar habitaciones:', error);
    return { data: [] as Habitacion[], error: error.message };
  }

  return { data: (data || []) as Habitacion[], error: null };
}

export async function createHabitacion(
  data: HabitacionFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = habitacionSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para criar habitaciones' };

  const { error } = await supabase.from('habitaciones').insert(parsed.data);

  if (error) {
    console.error('Erro ao criar habitación:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/alojamientos/${parsed.data.alojamiento_id}`);
  return { success: true };
}

export async function deleteHabitacion(
  id: string,
  alojamientoId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para eliminar habitaciones' };

  const { error } = await supabase
    .from('habitaciones')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar habitación:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/alojamientos/${alojamientoId}`);
  return { success: true };
}

/* ============================================================
 * Ocupación
 * ============================================================ */

export async function listarOcupaciones(alojamientoId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ocupacion')
    .select(`
      *,
      alojamientos:alojamiento_id (nombre),
      habitaciones:habitacion_id (numero),
      colaboradores:colaborador_id (nombre, apellido1, apellido2)
    `)
    .eq('alojamiento_id', alojamientoId)
    .is('deleted_at', null)
    .order('data_entrada', { ascending: false });

  if (error) {
    console.error('Erro ao listar ocupaciones:', error);
    return { data: [] as OcupacionCompleto[], error: error.message };
  }

  return { data: (data || []) as OcupacionCompleto[], error: null };
}

export async function listarColaboradoresAtivos() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('colaboradores')
    .select('id, nombre, apellido1, apellido2')
    .eq('estado', 'ativo')
    .is('deleted_at', null)
    .order('apellido1', { ascending: true });

  if (error) {
    console.error('Erro ao listar colaboradores:', error);
    return { data: [], error: error.message };
  }

  return {
    data: (data || []).map((c) => ({
      id: c.id,
      nombre_completo: [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' '),
    })),
    error: null,
  };
}

export async function createOcupacion(
  data: OcupacionFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = ocupacionSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para criar ocupaciones' };

  const { error } = await supabase.from('ocupacion').insert({
    ...parsed.data,
    data_entrada: parsed.data.data_entrada.toISOString().slice(0, 10),
    data_saida: parsed.data.data_saida ? parsed.data.data_saida.toISOString().slice(0, 10) : null,
  });

  if (error) {
    console.error('Erro ao criar ocupación:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/alojamientos/${parsed.data.alojamiento_id}`);
  return { success: true };
}

export async function finalizarOcupacion(
  id: string,
  alojamientoId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para alterar ocupaciones' };

  const { error } = await supabase
    .from('ocupacion')
    .update({ estado: 'concluida', data_saida: new Date().toISOString().slice(0, 10) })
    .eq('id', id);

  if (error) {
    console.error('Erro ao finalizar ocupación:', error);
    return { success: false, error: 'Erro ao finalizar' };
  }

  revalidatePath(`/${await getLocale()}/alojamientos/${alojamientoId}`);
  return { success: true };
}

export async function deleteOcupacion(
  id: string,
  alojamientoId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para eliminar ocupaciones' };

  const { error } = await supabase
    .from('ocupacion')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar ocupación:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/alojamientos/${alojamientoId}`);
  return { success: true };
}
