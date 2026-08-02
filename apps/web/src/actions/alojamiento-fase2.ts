'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { fixFilenameEncoding } from '@/lib/utils';
import { requireAdminOrRh } from '@/actions/alojamiento';
import {
  inventarioSchema,
  incidenciaSchema,
  contratoSchema,
  consumoSchema,
  type InventarioFormData,
  type IncidenciaFormData,
  type ContratoFormData,
  type ConsumoFormData,
} from '@/types/alojamiento';
import type {
  InventarioCompleto,
  FotografiaCompleto,
  IncidenciaCompleto,
  ContratoArrendamentoCompleto,
  Consumo,
} from '@/types/database';

const FOTOS_BUCKET = 'fotografias-alojamento';

/* ============================================================
 * Inventário
 * ============================================================ */

export async function listarInventario(alojamientoId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventario')
    .select('*, habitaciones:habitacion_id (numero)')
    .eq('alojamiento_id', alojamientoId)
    .is('deleted_at', null)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Erro ao listar inventário:', error);
    return { data: [] as InventarioCompleto[], error: error.message };
  }

  return { data: (data || []) as InventarioCompleto[], error: null };
}

export async function createInventario(
  data: InventarioFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = inventarioSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para gerir inventário' };

  const { error } = await supabase.from('inventario').insert(parsed.data);

  if (error) {
    console.error('Erro ao criar item de inventário:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/alojamientos/${parsed.data.alojamiento_id}`);
  return { success: true };
}

export async function deleteInventario(
  id: string,
  alojamientoId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para eliminar inventário' };

  const { error } = await supabase
    .from('inventario')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar item de inventário:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/alojamientos/${alojamientoId}`);
  return { success: true };
}

/* ============================================================
 * Fotografias
 * ============================================================ */

export async function listarFotografias(alojamientoId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('fotografias')
    .select('*, habitaciones:habitacion_id (numero)')
    .eq('alojamiento_id', alojamientoId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao listar fotografias:', error);
    return { data: [], error: error.message };
  }

  const fotos = (data || []) as FotografiaCompleto[];
  const withUrl = await Promise.all(
    fotos.map(async (f) => {
      const { data: signed } = await supabase.storage
        .from(FOTOS_BUCKET)
        .createSignedUrl(f.url, 3600);
      return { ...f, signedUrl: signed?.signedUrl || null };
    })
  );

  return { data: withUrl, error: null };
}

export async function uploadFotografia(
  alojamientoId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const file = formData.get('file') as File | null;
  const descripcion = (formData.get('descripcion') as string | null) || null;
  const habitacionId = (formData.get('habitacion_id') as string | null) || null;

  if (!file || file.size === 0) {
    return { success: false, error: 'Seleciona um ficheiro para carregar' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'Ficheiro demasiado grande (máximo 10 MB)' };
  }
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
    return { success: false, error: 'O ficheiro deve ser uma imagem ou PDF' };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para carregar fotografias' };

  const safeName = fixFilenameEncoding(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${alojamientoId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(FOTOS_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Erro no upload da fotografia:', uploadError);
    return { success: false, error: `Erro no upload: ${uploadError.message}` };
  }

  const { error: insertError } = await supabase.from('fotografias').insert({
    alojamiento_id: alojamientoId,
    habitacion_id: habitacionId || null,
    url: path,
    nombre: fixFilenameEncoding(file.name),
    mime_type: file.type || null,
    descripcion,
  });

  if (insertError) {
    await supabase.storage.from(FOTOS_BUCKET).remove([path]);
    console.error('Erro ao registar fotografia:', insertError);
    return { success: false, error: `Erro ao guardar na base de dados: ${insertError.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/alojamientos/${alojamientoId}`);
  return { success: true };
}

export async function deleteFotografia(
  id: string,
  alojamientoId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para eliminar fotografias' };

  const { data: foto } = await supabase
    .from('fotografias')
    .select('url')
    .eq('id', id)
    .single();

  if (foto?.url) {
    await supabase.storage.from(FOTOS_BUCKET).remove([foto.url]);
  }

  const { error } = await supabase
    .from('fotografias')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar fotografia:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/alojamientos/${alojamientoId}`);
  return { success: true };
}

/* ============================================================
 * Incidências
 * ============================================================ */

export async function listarIncidencias(alojamientoId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('incidencias')
    .select(`
      *,
      habitaciones:habitacion_id (numero),
      colaboradores:colaborador_id (nombre, apellido1, apellido2)
    `)
    .eq('alojamiento_id', alojamientoId)
    .is('deleted_at', null)
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Erro ao listar incidencias:', error);
    return { data: [] as IncidenciaCompleto[], error: error.message };
  }

  return { data: (data || []) as IncidenciaCompleto[], error: null };
}

export async function createIncidencia(
  data: IncidenciaFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = incidenciaSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para criar incidencias' };

  const { error } = await supabase.from('incidencias').insert(parsed.data);

  if (error) {
    console.error('Erro ao criar incidência:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/alojamientos/${parsed.data.alojamiento_id}`);
  return { success: true };
}

export async function resolverIncidencia(
  id: string,
  alojamientoId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para resolver incidencias' };

  const { error } = await supabase
    .from('incidencias')
    .update({ estado: 'resuelta', fecha_resolucion: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao resolver incidência:', error);
    return { success: false, error: 'Erro ao resolver' };
  }

  revalidatePath(`/${await getLocale()}/alojamientos/${alojamientoId}`);
  return { success: true };
}

export async function deleteIncidencia(
  id: string,
  alojamientoId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para eliminar incidencias' };

  const { error } = await supabase
    .from('incidencias')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar incidência:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/alojamientos/${alojamientoId}`);
  return { success: true };
}

/* ============================================================
 * Contratos
 * ============================================================ */

export async function listarContratos(alojamientoId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('contratos_arrendamento')
    .select(`
      *,
      habitaciones:habitacion_id (numero),
      colaboradores:colaborador_id (nombre, apellido1, apellido2)
    `)
    .eq('alojamiento_id', alojamientoId)
    .is('deleted_at', null)
    .order('data_inicio', { ascending: false });

  if (error) {
    console.error('Erro ao listar contratos:', error);
    return { data: [] as ContratoArrendamentoCompleto[], error: error.message };
  }

  return { data: (data || []) as ContratoArrendamentoCompleto[], error: null };
}

export async function createContrato(
  data: ContratoFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = contratoSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para criar contratos' };

  const { error } = await supabase.from('contratos_arrendamento').insert({
    ...parsed.data,
    data_inicio: parsed.data.data_inicio.toISOString().slice(0, 10),
    data_fim: parsed.data.data_fim ? parsed.data.data_fim.toISOString().slice(0, 10) : null,
  });

  if (error) {
    console.error('Erro ao criar contrato:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/alojamientos/${parsed.data.alojamiento_id}`);
  return { success: true };
}

export async function finalizarContrato(
  id: string,
  alojamientoId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para alterar contratos' };

  const { error } = await supabase
    .from('contratos_arrendamento')
    .update({ estado: 'vencido', data_fim: new Date().toISOString().slice(0, 10) })
    .eq('id', id);

  if (error) {
    console.error('Erro ao finalizar contrato:', error);
    return { success: false, error: 'Erro ao finalizar' };
  }

  revalidatePath(`/${await getLocale()}/alojamientos/${alojamientoId}`);
  return { success: true };
}

export async function deleteContrato(
  id: string,
  alojamientoId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para eliminar contratos' };

  const { error } = await supabase
    .from('contratos_arrendamento')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar contrato:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/alojamientos/${alojamientoId}`);
  return { success: true };
}

/* ============================================================
 * Consumos
 * ============================================================ */

export async function listarConsumos(alojamientoId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('consumos')
    .select('*')
    .eq('alojamiento_id', alojamientoId)
    .is('deleted_at', null)
    .order('data', { ascending: false });

  if (error) {
    console.error('Erro ao listar consumos:', error);
    return { data: [] as Consumo[], error: error.message };
  }

  return { data: (data || []) as Consumo[], error: null };
}

export async function createConsumo(
  data: ConsumoFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = consumoSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para registar consumos' };

  const { error } = await supabase.from('consumos').insert({
    ...parsed.data,
    data: parsed.data.data.toISOString().slice(0, 10),
  });

  if (error) {
    console.error('Erro ao registar consumo:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/alojamientos/${parsed.data.alojamiento_id}`);
  return { success: true };
}

export async function deleteConsumo(
  id: string,
  alojamientoId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para eliminar consumos' };

  const { error } = await supabase
    .from('consumos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar consumo:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/alojamientos/${alojamientoId}`);
  return { success: true };
}
