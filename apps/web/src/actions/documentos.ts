'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { fixFilenameEncoding } from '@/lib/utils';

/**
 * Server Actions para documentos anexos genéricos (por registo).
 * Permissões: admin/rh (CRUD), financeiro/auditor (leitura).
 */

const DOCUMENTOS_BUCKET = 'documentos';
const DOCUMENTOS_ROLES = ['admin', 'rh'];

export type EntidadeDocumento =
  | 'faturas'
  | 'nominas'
  | 'epis'
  | 'advertencias'
  | 'avaliacoes'
  | 'ferias'
  | 'exames'
  | 'alojamientos'
  | 'flota_vehiculos';

/** Rota principal do módulo para revalidar após upload/eliminação. */
const ROTA_ENTIDADE: Record<EntidadeDocumento, string> = {
  faturas: '/faturas',
  nominas: '/rh/nominas',
  epis: '/rh/epis',
  advertencias: '/rh/advertencias',
  avaliacoes: '/rh/avaliacoes',
  ferias: '/rh/ferias',
  exames: '/rh/exames',
  alojamientos: '/alojamientos',
  flota_vehiculos: '/flota/vehiculos',
};

async function requireRoles(supabase: ReturnType<typeof createClient>, roles: string[]) {
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

export interface DocumentoAnexo {
  id: string;
  entidade: string;
  entidade_id: string;
  categoria: string;
  nombre: string;
  descricao: string | null;
  referencia: string | null;
  archivo_url: string;
  archivo_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  expires_at: string | null;
  created_at: string;
}

/* ============================================================
 * Listas
 * ============================================================ */

/**
 * Lista os documentos de um registo com URLs assinados (1h).
 */
export async function listDocumentos(
  entidade: EntidadeDocumento,
  entidadeId: string
): Promise<{ data: Array<DocumentoAnexo & { url: string | null }>; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('entidade', entidade)
    .eq('entidade_id', entidadeId)
    .order('created_at', { ascending: false });

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

  return { data: withUrl as Array<DocumentoAnexo & { url: string | null }> };
}

/**
 * Lista todos os documentos (para o menu global /documentos).
 */
export async function listDocumentosGlobal(): Promise<{
  data: Array<DocumentoAnexo & { url: string | null }>;
  error?: string;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

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

  return { data: withUrl as Array<DocumentoAnexo & { url: string | null }> };
}

/**
 * Conta os documentos por registo de uma entidade (para listas com anexos).
 */
export async function countDocumentos(
  entidade: EntidadeDocumento
): Promise<{ documentos: Record<string, number>; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('documentos')
    .select('entidade_id')
    .eq('entidade', entidade);

  if (error) {
    return { documentos: {}, error: error.message };
  }

  const contagem: Record<string, number> = {};
  (data || []).forEach((r) => {
    contagem[r.entidade_id] = (contagem[r.entidade_id] || 0) + 1;
  });
  return { documentos: contagem, error: undefined };
}

/* ============================================================
 * Upload / Eliminação
 * ============================================================ */

/**
 * Faz upload de um documento para um registo (storage + BD).
 * Recebe um FormData com: file, categoria, descricao.
 */
export async function uploadDocumento(
  entidade: EntidadeDocumento,
  entidadeId: string,
  referencia: string | null,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, DOCUMENTOS_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para gerir documentos' };

  const file = formData.get('file') as File | null;
  const categoria = (formData.get('categoria') as string) || 'documento';
  const descricao = (formData.get('descricao') as string) || null;

  if (!file || file.size === 0) {
    return { success: false, error: 'Seleciona um ficheiro para carregar' };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { success: false, error: 'Ficheiro demasiado grande (máximo 20 MB)' };
  }

  const safeName = fixFilenameEncoding(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${entidade}/${entidadeId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTOS_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Erro no upload:', uploadError);
    return { success: false, error: `Erro no upload: ${uploadError.message}` };
  }

  const { error: insertError } = await supabase
    .from('documentos')
    .insert({
      entidade,
      entidade_id: entidadeId,
      categoria,
      nombre: fixFilenameEncoding(file.name),
      descricao,
      referencia,
      archivo_url: path,
      archivo_size: file.size,
      mime_type: file.type || null,
      uploaded_by: user.id,
    });

  if (insertError) {
    await supabase.storage.from(DOCUMENTOS_BUCKET).remove([path]);
    console.error('Erro ao registar documento:', insertError);
    return { success: false, error: `Erro ao registar documento: ${insertError.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}${ROTA_ENTIDADE[entidade]}`);
  revalidatePath(`/${locale}/documentos`);
  return { success: true };
}

/**
 * Elimina um documento (BD + ficheiro no storage).
 */
export async function eliminarDocumento(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireRoles(supabase, DOCUMENTOS_ROLES);
  if (!user) return { success: false, error: 'Sem permissão para gerir documentos' };

  const { data: doc } = await supabase
    .from('documentos')
    .select('entidade, entidade_id, archivo_url')
    .eq('id', id)
    .single();

  if (!doc) return { success: false, error: 'Documento não encontrado' };

  const { error } = await supabase.from('documentos').delete().eq('id', id);

  if (error) {
    return { success: false, error: `Erro ao eliminar: ${error.message}` };
  }

  await supabase.storage.from(DOCUMENTOS_BUCKET).remove([doc.archivo_url]);

  const entidade = doc.entidade as EntidadeDocumento;
  const locale = await getLocale();
  if (ROTA_ENTIDADE[entidade]) {
    revalidatePath(`/${locale}${ROTA_ENTIDADE[entidade]}`);
  }
  revalidatePath(`/${locale}/documentos`);
  return { success: true };
}
