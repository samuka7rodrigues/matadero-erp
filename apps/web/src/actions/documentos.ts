'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { fixFilenameEncoding } from '@/lib/utils';
import { eliminarDocumento as eliminarDocumentoColaborador } from '@/actions/colaboradores';
import { eliminarContratoDocumento } from '@/actions/contratos';
import { eliminarDocumentoFinanzas } from '@/actions/finanzas';

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
  | 'flota_vehiculos'
  | 'flota_itv'
  | 'flota_seguros'
  | 'flota_mantenimiento'
  | 'flota_combustible'
  | 'flota_kilometraje'
  | 'flota_multas'
  | 'horas_extras'
  | 'presupuestos'
  | 'cobros'
  | 'pagos'
  | 'despesas';

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
  flota_itv: '/flota/itv',
  flota_seguros: '/flota/seguros',
  flota_mantenimiento: '/flota/mantenimiento',
  flota_combustible: '/flota/combustible',
  flota_kilometraje: '/flota/kilometraje',
  flota_multas: '/flota/multas',
  horas_extras: '/rh/horas-extras',
  presupuestos: '/presupuestos',
  cobros: '/cobros',
  pagos: '/pagos',
  despesas: '/despesas',
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

/** Sistemas de documentos existentes (cada um com a sua tabela/bucket). */
export type DocumentoOrigem = 'documentos' | 'contratos' | 'colaboradores' | 'finanzas';

/** Bucket de storage usado por cada origem. */
const BUCKET_ORIGEM: Record<DocumentoOrigem, string> = {
  documentos: 'documentos',
  contratos: 'contratos-documentos',
  colaboradores: 'documentos-colaboradores',
  finanzas: 'documentos-finanzas',
};

/** Item unificado do menu global de Documentos. */
export type DocumentoMenu = DocumentoAnexo & { url: string | null; origem: DocumentoOrigem };

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
 * Une os vários sistemas existentes: documentos (genéricos), contratos,
 * colaboradores e finanzas.
 */
export async function listDocumentosGlobal(): Promise<{
  data: DocumentoMenu[];
  error?: string;
}> {
  const supabase = createClient();

  const [genericos, contratos, colaboradores, finanzas] = await Promise.all([
    supabase.from('documentos').select('*').order('created_at', { ascending: false }),
    supabase
      .from('contratos_documentos')
      .select('*, contratos (numero)')
      .order('created_at', { ascending: false }),
    supabase
      .from('documentos_colaborador')
      .select('*, colaboradores (nombre, apellido1, apellido2)')
      .order('created_at', { ascending: false }),
    supabase.from('documentos_finanzas').select('*').order('created_at', { ascending: false }),
  ]);

  const erro =
    genericos.error?.message ||
    contratos.error?.message ||
    colaboradores.error?.message ||
    finanzas.error?.message;
  if (erro) {
    return { data: [], error: erro };
  }

  const itens: DocumentoMenu[] = [];

  (genericos.data || []).forEach((d) => {
    itens.push({
      id: d.id,
      entidade: d.entidade,
      entidade_id: d.entidade_id,
      categoria: d.categoria,
      nombre: d.nombre,
      descricao: d.descricao ?? null,
      referencia: d.referencia,
      archivo_url: d.archivo_url,
      archivo_size: d.archivo_size ?? null,
      mime_type: d.mime_type ?? null,
      uploaded_by: d.uploaded_by ?? null,
      expires_at: d.expires_at ? String(d.expires_at) : null,
      created_at: d.created_at,
      url: null,
      origem: 'documentos',
    });
  });

  (contratos.data || []).forEach((d) => {
    itens.push({
      id: d.id,
      entidade: 'contratos',
      entidade_id: d.contrato_id,
      categoria: d.categoria || 'documento',
      nombre: d.nombre,
      descricao: d.descripcion ?? null,
      referencia: d.contratos?.numero ? `Contrato ${d.contratos.numero}` : 'Contrato',
      archivo_url: d.archivo_url,
      archivo_size: d.archivo_size ?? null,
      mime_type: d.mime_type ?? null,
      uploaded_by: d.uploaded_by ?? null,
      expires_at: d.expires_at ? String(d.expires_at) : null,
      created_at: d.created_at,
      url: null,
      origem: 'contratos',
    });
  });

  (colaboradores.data || []).forEach((d) => {
    const c = d.colaboradores;
    const nome = c ? [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ') : 'Colaborador';
    itens.push({
      id: d.id,
      entidade: 'colaboradores',
      entidade_id: d.colaborador_id,
      categoria: d.tipo,
      nombre: d.nombre,
      descricao: d.descripcion ?? null,
      referencia: nome,
      archivo_url: d.archivo_url,
      archivo_size: d.archivo_size ?? null,
      mime_type: d.mime_type ?? null,
      uploaded_by: d.uploaded_by ?? null,
      expires_at: d.expires_at ? String(d.expires_at) : null,
      created_at: d.created_at,
      url: null,
      origem: 'colaboradores',
    });
  });

  (finanzas.data || []).forEach((d) => {
    itens.push({
      id: d.id,
      entidade: 'finanzas',
      entidade_id: d.id,
      categoria: d.categoria || 'outro',
      nombre: d.nombre,
      descricao: d.descripcion ?? null,
      referencia: d.descripcion || d.categoria || 'Finanzas',
      archivo_url: d.archivo_url,
      archivo_size: d.archivo_size ?? null,
      mime_type: d.mime_type ?? null,
      uploaded_by: d.uploaded_by ?? null,
      expires_at: d.expires_at ? String(d.expires_at) : null,
      created_at: d.created_at,
      url: null,
      origem: 'finanzas',
    });
  });

  const withUrl = await Promise.all(
    itens.map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET_ORIGEM[doc.origem])
        .createSignedUrl(doc.archivo_url, 3600);
      return { ...doc, nombre: fixFilenameEncoding(doc.nombre), url: signed?.signedUrl || null };
    })
  );

  withUrl.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { data: withUrl.slice(0, 500) };
}

/**
 * Elimina um documento a partir do menu global, encaminhando para o
 * sistema correto consoante a origem.
 */
export async function eliminarDocumentoMenu(
  id: string,
  origem: DocumentoOrigem
): Promise<{ success: boolean; error?: string }> {
  if (origem === 'contratos') return eliminarContratoDocumento(id);
  if (origem === 'colaboradores') return eliminarDocumentoColaborador(id);
  if (origem === 'finanzas') return eliminarDocumentoFinanzas(id);
  return eliminarDocumento(id);
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
