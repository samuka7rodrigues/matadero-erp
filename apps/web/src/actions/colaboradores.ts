'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fixFilenameEncoding } from '@/lib/utils';
import { colaboradorSchema, type ColaboradorFormData } from '@/types/colaboradores';
import type {
  ColaboradorCompleto,
  DocumentoColaborador,
  RoleUtilizador,
} from '@/types/database';

/**
 * Server Actions para gestão de colaboradores.
 * Usa o cliente admin (service role) para operações de auth/limpeza
 * e o cliente normal respeitando RLS.
 */

/**
 * Cria um novo colaborador e, se pedido, o utilizador de acesso ao portal
 * (auth.users + public.utilizadores).
 * Permissão: apenas RH ou admin.
 */
export async function createColaborador(data: ColaboradorFormData): Promise<{
  success: boolean;
  error?: string;
  id?: string;
}> {
  // Validação
  const parsed = colaboradorSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  // Campos de acesso ao portal NÃO são colunas de colaboradores
  const { criar_acesso, role, password, confirmar_password, ...colaboradorData } = parsed.data;
  void confirmar_password;

  const supabase = createClient();

  // Verificar permissão (utilizador deve ser RH ou admin)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!utilizador || !['admin', 'rh'].includes(utilizador.role)) {
    return { success: false, error: 'Sem permissão para criar colaboradores' };
  }

  // Verificar email único (coluna CITEXT UNIQUE)
  const { data: existingEmail, error: emailCheckError } = await supabase
    .from('colaboradores')
    .select('id')
    .ilike('email', colaboradorData.email)
    .is('deleted_at', null)
    .maybeSingle();

  if (emailCheckError) {
    console.error('Erro ao verificar email duplicado:', emailCheckError);
  } else if (existingEmail) {
    return { success: false, error: 'Já existe um colaborador com este email' };
  }

  // Se vai criar acesso, garantir que o email ainda não é usado no auth
  if (criar_acesso) {
    const admin = createAdminClient();
    const { data: authUser } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const emailExiste = authUser?.users.some(
      (u) => u.email?.toLowerCase() === colaboradorData.email.toLowerCase()
    );
    if (emailExiste) {
      return { success: false, error: 'Já existe um utilizador de acesso com este email' };
    }
  }

  // Inserir o colaborador (RLS garante que só admin/rh podem inserir)
  const { data: newColaborador, error } = await supabase
    .from('colaboradores')
    .insert(colaboradorData)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar colaborador:', error);
    return {
      success: false,
      error: `Erro ao guardar na base de dados: ${error.message}${error.details ? ` (${error.details})` : ''}`,
    };
  }

  // Criar acesso ao portal (auth + utilizador) — com rollback se falhar
  if (criar_acesso && password) {
    const admin = createAdminClient();
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: colaboradorData.email,
      password,
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      // Rollback do colaborador recém-criado
      await admin.from('colaboradores').delete().eq('id', newColaborador.id);
      console.error('Erro ao criar utilizador de acesso:', authError);
      return {
        success: false,
        error: `Erro ao criar o acesso: ${authError?.message || 'falha no auth'}`,
      };
    }

    const { error: linkError } = await admin.from('utilizadores').insert({
      user_id: authUser.user.id,
      colaborador_id: newColaborador.id,
      email: colaboradorData.email,
      role: role as RoleUtilizador,
      ativo: true,
    });

    if (linkError) {
      // Rollback: remove colaborador e utilizador de auth
      await admin.from('colaboradores').delete().eq('id', newColaborador.id);
      await admin.auth.admin.deleteUser(authUser.user.id);
      console.error('Erro ao ligar utilizador ao colaborador:', linkError);
      return { success: false, error: 'Erro ao ligar o acesso ao colaborador' };
    }
  }

  revalidatePath(`/${await getLocale()}/colaboradores`);
  return { success: true, id: newColaborador.id };
}

/**
 * Actualiza colaborador existente.
 */
export async function updateColaborador(
  id: string,
  data: ColaboradorFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Verificar permissão
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!utilizador || !['admin', 'rh'].includes(utilizador.role)) {
    return { success: false, error: 'Sem permissão' };
  }

  // Validação (os campos de acesso são opcionais na edição)
  const parsed = colaboradorSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  // Remove campos de acesso ao portal (não são colunas de colaboradores)
  const { criar_acesso, role, password, confirmar_password, ...dadosColaborador } = parsed.data;
  void criar_acesso;
  void role;
  void password;
  void confirmar_password;

  // Verificar email único, excluindo o próprio colaborador
  const { data: existingEmail } = await supabase
    .from('colaboradores')
    .select('id')
    .ilike('email', dadosColaborador.email)
    .is('deleted_at', null)
    .neq('id', id)
    .maybeSingle();

  if (existingEmail) {
    return { success: false, error: 'Já existe um colaborador com este email' };
  }

  const { error } = await supabase
    .from('colaboradores')
    .update(dadosColaborador)
    .eq('id', id);

  if (error) {
    console.error('Erro ao actualizar colaborador:', error);
    return { success: false, error: `Erro ao actualizar: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/colaboradores`);
  revalidatePath(`/${locale}/colaboradores/${id}`);
  return { success: true };
}

/**
 * Soft-delete (estado = inativo, deleted_at = now).
 */
export async function deleteColaborador(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Verificar permissão
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!utilizador || !['admin', 'rh'].includes(utilizador.role)) {
    return { success: false, error: 'Sem permissão' };
  }

  const { error } = await supabase
    .from('colaboradores')
    .update({
      estado: 'inativo',
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/colaboradores`);
  return { success: true };
}

/**
 * Lista colaboradores com paginação e busca.
 */
export async function listColaboradores(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  estado?: string;
  departamentoId?: string;
}) {
  const supabase = createClient();
  const page = params.page || 1;
  const pageSize = params.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('colaboradores')
    .select(`
      *,
      departamentos:departamento_id (nombre)
    `, { count: 'exact' })
    .is('deleted_at', null)
    .order('apellido1', { ascending: true })
    .range(from, to);

  if (params.search) {
    query = query.or(`nombre.ilike.%${params.search}%,apellido1.ilike.%${params.search}%,nif.eq.${params.search},email.ilike.%${params.search}%`);
  }
  if (params.estado) {
    query = query.eq('estado', params.estado);
  }
  if (params.departamentoId) {
    query = query.eq('departamento_id', params.departamentoId);
  }

  const { data, error, count } = await query;

  if (error) {
    return { data: [], total: 0, page, pageSize, totalPages: 0, error: error.message };
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function exportarColaboradores(params: {
  search?: string;
  estado?: string;
  departamentoId?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from('colaboradores')
    .select(`
      *,
      departamentos:departamento_id (nombre)
    `)
    .is('deleted_at', null)
    .order('apellido1', { ascending: true });

  if (params.search) {
    query = query.or(`nombre.ilike.%${params.search}%,apellido1.ilike.%${params.search}%,nif.eq.${params.search},email.ilike.%${params.search}%`);
  }
  if (params.estado) {
    query = query.eq('estado', params.estado);
  }
  if (params.departamentoId) {
    query = query.eq('departamento_id', params.departamentoId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}

/**
 * Obtém um colaborador por ID.
 */
export async function getColaborador(id: string): Promise<ColaboradorCompleto | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('colaboradores')
    .select(`
      *,
      departamentos:departamento_id (nombre, codigo)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Erro ao obter colaborador:', error);
    return null;
  }

  return data;
}

/**
 * Lista departamentos (para select no form).
 */
export async function listDepartamentos() {
  const supabase = createClient();
  const { data } = await supabase
    .from('departamentos')
    .select('id, codigo, nombre')
    .eq('activo', true)
    .order('nombre');
  return data || [];
}

/**
 * Verifica se o utilizador autenticado é RH ou admin.
 */
async function requireDocumentosAcesso(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!utilizador || !['admin', 'rh', 'encarregado', 'auditor'].includes(utilizador.role)) return null;
  return user;
}

const DOCUMENTOS_BUCKET = 'documentos-colaboradores';

/**
 * Lista os documentos de um colaborador com URLs assinados (1h).
 */
export async function listDocumentos(colaboradorId: string): Promise<{
  data: Array<DocumentoColaborador & { url: string | null }>;
  error?: string;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('documentos_colaborador')
    .select('*')
    .eq('colaborador_id', colaboradorId)
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
 * Faz upload de um documento para o colaborador (storage + registo na BD).
 * Recebe um FormData com: file, tipo, descripcion, expires_at.
 */
export async function uploadDocumento(
  colaboradorId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireDocumentosAcesso(supabase);
  if (!user) return { success: false, error: 'Sem permissão para gerir documentos' };

  const file = formData.get('file') as File | null;
  const tipo = formData.get('tipo') as string | null;
  const descripcion = (formData.get('descripcion') as string) || null;
  const expiresAt = (formData.get('expires_at') as string) || null;

  if (!file || file.size === 0) {
    return { success: false, error: 'Seleciona um ficheiro para carregar' };
  }
  if (!tipo) {
    return { success: false, error: 'Seleciona o tipo de documento' };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { success: false, error: 'Ficheiro demasiado grande (máximo 20 MB)' };
  }

  const safeName = fixFilenameEncoding(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${colaboradorId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTOS_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Erro no upload:', uploadError);
    return { success: false, error: `Erro no upload: ${uploadError.message}` };
  }

  const { data: documento, error: insertError } = await supabase
    .from('documentos_colaborador')
    .insert({
      colaborador_id: colaboradorId,
      tipo,
      nombre: fixFilenameEncoding(file.name),
      descripcion,
      archivo_url: path,
      archivo_size: file.size,
      mime_type: file.type || null,
      uploaded_by: user.id,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(DOCUMENTOS_BUCKET).remove([path]);
    console.error('Erro ao registar documento:', insertError);
    return { success: false, error: `Erro ao registar documento: ${insertError.message}` };
  }

  void documento;
  const locale = await getLocale();
  revalidatePath(`/${locale}/colaboradores/${colaboradorId}`);
  return { success: true };
}

/**
 * Elimina um documento (BD + ficheiro no storage).
 */
export async function eliminarDocumento(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireDocumentosAcesso(supabase);
  if (!user) return { success: false, error: 'Sem permissão para gerir documentos' };

  const { data: doc } = await supabase
    .from('documentos_colaborador')
    .select('colaborador_id, archivo_url')
    .eq('id', id)
    .single();

  if (!doc) return { success: false, error: 'Documento não encontrado' };

  const { error } = await supabase
    .from('documentos_colaborador')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: `Erro ao eliminar: ${error.message}` };
  }

  if (doc.archivo_url) {
    await supabase.storage.from(DOCUMENTOS_BUCKET).remove([doc.archivo_url]);
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/colaboradores/${doc.colaborador_id}`);
  return { success: true };
}
