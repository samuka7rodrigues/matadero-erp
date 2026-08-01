'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import type { z } from 'zod';
import {
  ausenciaSchema,
  cursoSchema,
  certificadoSchema,
  advertenciaSchema,
  avaliacaoSchema,
  feriasSchema,
  exameMedicoSchema,
  entregaEPISchema,
  type AusenciaFormData,
  type CursoFormData,
  type CertificadoFormData,
  type AdvertenciaFormData,
  type AvaliacaoFormData,
  type FeriasFormData,
  type ExameMedicoFormData,
  type EntregaEPIFormData,
} from '@/types/rh';
import type {
  Ausencia,
  AusenciaCompleto,
  Curso,
  CursoCompleto,
  Certificado,
  CertificadoCompleto,
  Advertencia,
  AdvertenciaCompleto,
  Avaliacao,
  AvaliacaoCompleto,
  Ferias,
  ExameMedico,
  EntregaEPI,
} from '@/types/database';

/**
 * Server Actions para o módulo RH ampliado.
 * Permissões:
 * - Admin/RH: CRUD completo.
 * - Encarregado: leitura.
 * - Auditor: leitura.
 * - Colaborador: leitura dos próprios registos.
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

const RH_ROLES = ['admin', 'rh'];

function parseError(parsed: z.SafeParseReturnType<unknown, unknown>): string {
  if (parsed.success) return '';
  return `Dados inválidos: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`;
}

const COLABORADOR_SELECT = 'nombre, apellido1, apellido2';

/* ============================================================
 * Ausencias
 * ============================================================ */

export async function listAusencias() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ausencias')
    .select(`*, colaboradores (${COLABORADOR_SELECT})`)
    .order('data_inicio', { ascending: false });

  if (error) {
    console.error('Erro ao listar ausências:', error);
    return { data: [] as AusenciaCompleto[], error: error.message };
  }
  return { data: (data || []) as AusenciaCompleto[], error: null };
}

export async function createAusencia(
  data: AusenciaFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = ausenciaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar ausências' };

  const { data: novo, error } = await supabase
    .from('ausencias')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar ausência:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/rh/ausencias`);
  return { success: true, id: (novo as Ausencia).id };
}

export async function updateAusenciaEstado(
  id: string,
  estado: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para atualizar ausências' };

  const { error } = await supabase
    .from('ausencias')
    .update({ estado })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar ausência:', error);
    return { success: false, error: `Erro ao atualizar: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/rh/ausencias`);
  return { success: true };
}

export async function deleteAusencia(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar ausências' };

  const { error } = await supabase
    .from('ausencias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar ausência:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/rh/ausencias`);
  return { success: true };
}

/* ============================================================
 * Cursos
 * ============================================================ */

export async function listCursos() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cursos')
    .select(`*, colaboradores (${COLABORADOR_SELECT})`)
    .order('data_inicio', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Erro ao listar cursos:', error);
    return { data: [] as CursoCompleto[], error: error.message };
  }
  return { data: (data || []) as CursoCompleto[], error: null };
}

export async function createCurso(
  data: CursoFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = cursoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar cursos' };

  const { data: novo, error } = await supabase
    .from('cursos')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar curso:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/rh/cursos`);
  return { success: true, id: (novo as Curso).id };
}

export async function updateCursoEstado(
  id: string,
  estado: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para atualizar cursos' };

  const { error } = await supabase
    .from('cursos')
    .update({ estado })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar curso:', error);
    return { success: false, error: `Erro ao atualizar: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/rh/cursos`);
  return { success: true };
}

export async function deleteCurso(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar cursos' };

  const { error } = await supabase
    .from('cursos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar curso:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/rh/cursos`);
  return { success: true };
}

/* ============================================================
 * Certificados
 * ============================================================ */

export async function listCertificados() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('certificados')
    .select(`*, colaboradores (${COLABORADOR_SELECT})`)
    .order('data_emision', { ascending: false });

  if (error) {
    console.error('Erro ao listar certificados:', error);
    return { data: [] as CertificadoCompleto[], error: error.message };
  }
  return { data: (data || []) as CertificadoCompleto[], error: null };
}

export async function createCertificado(
  data: CertificadoFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = certificadoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar certificados' };

  const { data: novo, error } = await supabase
    .from('certificados')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar certificado:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/rh/certificados`);
  return { success: true, id: (novo as Certificado).id };
}

export async function deleteCertificado(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar certificados' };

  const { error } = await supabase
    .from('certificados')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar certificado:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/rh/certificados`);
  return { success: true };
}

/* ============================================================
 * Advertencias
 * ============================================================ */

export async function listAdvertencias() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('advertencias')
    .select(`*, colaboradores (${COLABORADOR_SELECT})`)
    .order('data_advertencia', { ascending: false });

  if (error) {
    console.error('Erro ao listar advertências:', error);
    return { data: [] as AdvertenciaCompleto[], error: error.message };
  }
  return { data: (data || []) as AdvertenciaCompleto[], error: null };
}

export async function createAdvertencia(
  data: AdvertenciaFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = advertenciaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar advertências' };

  const { data: novo, error } = await supabase
    .from('advertencias')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar advertência:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/rh/advertencias`);
  return { success: true, id: (novo as Advertencia).id };
}

export async function updateAdvertenciaEstado(
  id: string,
  estado: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para atualizar advertências' };

  const { error } = await supabase
    .from('advertencias')
    .update({ estado })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar advertência:', error);
    return { success: false, error: `Erro ao atualizar: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/rh/advertencias`);
  return { success: true };
}

export async function deleteAdvertencia(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar advertências' };

  const { error } = await supabase
    .from('advertencias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar advertência:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/rh/advertencias`);
  return { success: true };
}

/* ============================================================
 * Avaliacoes
 * ============================================================ */

export async function listAvaliacoes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('avaliacoes')
    .select(`*, colaboradores (${COLABORADOR_SELECT}), avaliadores:avaliador_id (${COLABORADOR_SELECT})`)
    .order('data_avaliacao', { ascending: false });

  if (error) {
    console.error('Erro ao listar avaliações:', error);
    return { data: [] as AvaliacaoCompleto[], error: error.message };
  }
  return { data: (data || []) as AvaliacaoCompleto[], error: null };
}

export async function createAvaliacao(
  data: AvaliacaoFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = avaliacaoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar avaliações' };

  const { data: novo, error } = await supabase
    .from('avaliacoes')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar avaliação:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/rh/avaliacoes`);
  return { success: true, id: (novo as Avaliacao).id };
}

export async function deleteAvaliacao(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar avaliações' };

  const { error } = await supabase
    .from('avaliacoes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar avaliação:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/rh/avaliacoes`);
  return { success: true };
}

/* ============================================================
 * Ferias
 * ============================================================ */

export async function listFerias() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ferias')
    .select(`*, colaboradores (${COLABORADOR_SELECT})`)
    .order('data_inicio', { ascending: false });

  if (error) {
    console.error('Erro ao listar férias:', error);
    return { data: [] as Array<Ferias & { colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null }>, error: error.message };
  }
  return { data: (data || []) as Array<Ferias & { colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null }>, error: null };
}

export async function createFerias(
  data: FeriasFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = feriasSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar férias' };

  const { data: novo, error } = await supabase
    .from('ferias')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar férias:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/rh/ferias`);
  return { success: true, id: (novo as Ferias).id };
}

export async function updateFeriasEstado(
  id: string,
  estado: string,
  motivo_rejeicao?: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para atualizar férias' };

  const update: Record<string, unknown> = { estado };
  if (estado === 'aprovado') {
    update.aprovado_por = user.id;
    update.aprovado_em = new Date().toISOString();
  }
  if (estado === 'rejeitado') {
    update.motivo_rejeicao = motivo_rejeicao ?? null;
  }

  const { error } = await supabase
    .from('ferias')
    .update(update)
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar férias:', error);
    return { success: false, error: `Erro ao atualizar: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/rh/ferias`);
  return { success: true };
}

export async function deleteFerias(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar férias' };

  const { error } = await supabase
    .from('ferias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar férias:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/rh/ferias`);
  return { success: true };
}

/* ============================================================
 * Exames médicos
 * ============================================================ */

export async function listExamesMedicos() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('exames_medicos')
    .select(`*, colaboradores (${COLABORADOR_SELECT})`)
    .order('fecha_examen', { ascending: false });

  if (error) {
    console.error('Erro ao listar exames médicos:', error);
    return { data: [] as Array<ExameMedico & { colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null }>, error: error.message };
  }
  return { data: (data || []) as Array<ExameMedico & { colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null }>, error: null };
}

export async function createExameMedico(
  data: ExameMedicoFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = exameMedicoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar exames médicos' };

  const { data: novo, error } = await supabase
    .from('exames_medicos')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar exame médico:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/rh/exames`);
  return { success: true, id: (novo as ExameMedico).id };
}

export async function deleteExameMedico(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar exames médicos' };

  const { error } = await supabase
    .from('exames_medicos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar exame médico:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/rh/exames`);
  return { success: true };
}

/* ============================================================
 * Entregas EPI
 * ============================================================ */

export async function listEntregasEPI() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('entregas_epi')
    .select(`*, colaboradores (${COLABORADOR_SELECT})`)
    .order('fecha_entrega', { ascending: false });

  if (error) {
    console.error('Erro ao listar entregas EPI:', error);
    return { data: [] as Array<EntregaEPI & { colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null }>, error: error.message };
  }
  return { data: (data || []) as Array<EntregaEPI & { colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null }>, error: null };
}

export async function createEntregaEPI(
  data: EntregaEPIFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = entregaEPISchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar entregas EPI' };

  const { data: novo, error } = await supabase
    .from('entregas_epi')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar entrega EPI:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/rh/epis`);
  return { success: true, id: (novo as EntregaEPI).id };
}

export async function deleteEntregaEPI(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, RH_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar entregas EPI' };

  const { error } = await supabase
    .from('entregas_epi')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar entrega EPI:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/rh/epis`);
  return { success: true };
}

/* ============================================================
 * Lista de colaboradores ativos (para selects)
 * ============================================================ */

export async function listColaboradoresAtivos() {
  const supabase = createClient();
  const { data } = await supabase
    .from('colaboradores')
    .select('id, nombre, apellido1, apellido2')
    .eq('estado', 'ativo')
    .is('deleted_at', null)
    .order('apellido1', { ascending: true });
  return data || [];
}
