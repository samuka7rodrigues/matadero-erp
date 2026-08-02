'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { fixFilenameEncoding } from '@/lib/utils';
import type { z } from 'zod';
import {
  contratoSchema,
  contratoFirmaSchema,
  type ContratoFormData,
  type ContratoFirmaFormData,
} from '@/types/contratos';
import type {
  ContratoGeral,
  ContratoGeralCompleto,
  ContratoDocumento,
  ContratoFirma,
} from '@/types/database';

/**
 * Server Actions para o módulo Contratos.
 * Permissões: admin/rh (CRUD), auditor (leitura).
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

const CONTRATOS_ROLES = ['admin', 'rh'];

function parseError(parsed: z.SafeParseReturnType<unknown, unknown>): string {
  if (parsed.success) return '';
  return `Dados inválidos: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`;
}

/* ============================================================
 * Contratos
 * ============================================================ */

export async function listContratos() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('contratos')
    .select('*, empresas (nombre, nombre_comercial), clientes (nombre), colaboradores (nombre, apellido1, apellido2)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao listar contratos:', error);
    return { data: [] as ContratoGeralCompleto[], error: error.message };
  }
  return { data: (data || []) as ContratoGeralCompleto[], error: null };
}

export async function getContrato(id: string): Promise<ContratoGeralCompleto | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('contratos')
    .select('*, empresas (nombre, nombre_comercial), clientes (nombre), colaboradores (nombre, apellido1, apellido2)')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Erro ao obter contrato:', error);
    return null;
  }
  return data as ContratoGeralCompleto;
}

/**
 * Conta documentos e firmas por contrato (para o grid de cards).
 */
export async function getContratoCounts(): Promise<{
  documentos: Record<string, number>;
  firmas: Record<string, number>;
}> {
  const supabase = createClient();

  const { data: docs } = await supabase.from('contratos_documentos').select('contrato_id');
  const { data: firmas } = await supabase.from('contratos_firmas').select('contrato_id');

  const contagem = (rows: { contrato_id: string }[] | null) => {
    const map: Record<string, number> = {};
    (rows || []).forEach((r) => {
      map[r.contrato_id] = (map[r.contrato_id] || 0) + 1;
    });
    return map;
  };

  return { documentos: contagem(docs), firmas: contagem(firmas) };
}

export async function createContrato(
  data: ContratoFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = contratoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, CONTRATOS_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para criar contratos' };

  const { data: novo, error } = await supabase
    .from('contratos')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar contrato:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/contratos`);
  return { success: true, id: (novo as ContratoGeral).id };
}

export async function updateContrato(
  id: string,
  data: ContratoFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = contratoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, CONTRATOS_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para editar contratos' };

  const { error } = await supabase
    .from('contratos')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao actualizar contrato:', error);
    return { success: false, error: `Erro ao actualizar: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/contratos`);
  revalidatePath(`/${locale}/contratos/${id}`);
  return { success: true };
}

export async function updateContratoEstado(
  id: string,
  estado: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, CONTRATOS_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para actualizar contratos' };

  const { error } = await supabase
    .from('contratos')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao actualizar estado do contrato:', error);
    return { success: false, error: `Erro ao actualizar: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/contratos`);
  revalidatePath(`/${locale}/contratos/${id}`);
  return { success: true };
}

export async function deleteContrato(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, CONTRATOS_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para eliminar contratos' };

  const { error } = await supabase
    .from('contratos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar contrato:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/contratos`);
  return { success: true };
}

/* ============================================================
 * Documentos anexos
 * ============================================================ */

const DOCUMENTOS_BUCKET = 'contratos-documentos';

/**
 * Lista os documentos de um contrato com URLs assinados (1h).
 */
export async function listContratoDocumentos(contratoId: string): Promise<{
  data: Array<ContratoDocumento & { url: string | null }>;
  error?: string;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('contratos_documentos')
    .select('*')
    .eq('contrato_id', contratoId)
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
 * Faz upload de um documento para o contrato (storage + registo na BD).
 * Recebe um FormData com: file, categoria, descripcion, expires_at.
 */
export async function uploadContratoDocumento(
  contratoId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, CONTRATOS_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para gerir documentos' };

  const file = formData.get('file') as File | null;
  const categoria = (formData.get('categoria') as string) || 'contrato';
  const descripcion = (formData.get('descripcion') as string) || null;
  const expiresAt = (formData.get('expires_at') as string) || null;

  if (!file || file.size === 0) {
    return { success: false, error: 'Seleciona um ficheiro para carregar' };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { success: false, error: 'Ficheiro demasiado grande (máximo 20 MB)' };
  }

  const safeName = fixFilenameEncoding(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${contratoId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTOS_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Erro no upload:', uploadError);
    return { success: false, error: `Erro no upload: ${uploadError.message}` };
  }

  const { error: insertError } = await supabase
    .from('contratos_documentos')
    .insert({
      contrato_id: contratoId,
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
  revalidatePath(`/${locale}/contratos/${contratoId}`);
  return { success: true };
}

/**
 * Elimina um documento (BD + ficheiro no storage).
 */
export async function eliminarContratoDocumento(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, CONTRATOS_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para gerir documentos' };

  const { data: doc } = await supabase
    .from('contratos_documentos')
    .select('contrato_id, archivo_url')
    .eq('id', id)
    .single();

  if (!doc) return { success: false, error: 'Documento não encontrado' };

  const { error } = await supabase
    .from('contratos_documentos')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: `Erro ao eliminar: ${error.message}` };
  }

  if (doc.archivo_url) {
    await supabase.storage.from(DOCUMENTOS_BUCKET).remove([doc.archivo_url]);
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/contratos/${doc.contrato_id}`);
  return { success: true };
}

/* ============================================================
 * Firmas
 * ============================================================ */

export async function listContratoFirmas(contratoId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('contratos_firmas')
    .select('*')
    .eq('contrato_id', contratoId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao listar firmas:', error);
    return { data: [] as ContratoFirma[], error: error.message };
  }
  return { data: (data || []) as ContratoFirma[], error: null };
}

export async function createContratoFirma(
  contratoId: string,
  data: ContratoFirmaFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = contratoFirmaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, CONTRATOS_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para gerir firmas' };

  const { data: nova, error } = await supabase
    .from('contratos_firmas')
    .insert({ ...parsed.data, contrato_id: contratoId })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar firma:', error);
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/contratos/${contratoId}`);
  return { success: true, id: (nova as ContratoFirma).id };
}

export async function updateContratoFirma(
  id: string,
  data: ContratoFirmaFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = contratoFirmaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parseError(parsed) };

  const supabase = createClient();
  const user = await requireRoles(supabase, CONTRATOS_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para gerir firmas' };

  const { data: firma } = await supabase
    .from('contratos_firmas')
    .select('contrato_id')
    .eq('id', id)
    .single();

  if (!firma) return { success: false, error: 'Firma não encontrada' };

  const { error } = await supabase
    .from('contratos_firmas')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao actualizar firma:', error);
    return { success: false, error: `Erro ao actualizar: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/contratos/${firma.contrato_id}`);
  return { success: true };
}

export async function deleteContratoFirma(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, CONTRATOS_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para gerir firmas' };

  const { data: firma } = await supabase
    .from('contratos_firmas')
    .select('contrato_id')
    .eq('id', id)
    .single();

  if (!firma) return { success: false, error: 'Firma não encontrada' };

  const { error } = await supabase
    .from('contratos_firmas')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: `Erro ao eliminar: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/contratos/${firma.contrato_id}`);
  return { success: true };
}
