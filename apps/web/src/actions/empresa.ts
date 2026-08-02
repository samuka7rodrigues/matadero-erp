'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { fixFilenameEncoding } from '@/lib/utils';
import { empresaSchema, type EmpresaFormData } from '@/types/empresa';
import type { Empresa } from '@/types/database';

/**
 * Server Actions para o cadastro de empresas.
 * Permissões: admin/rh (CRUD completo), financeiro/auditor (leitura).
 */

const LOGOS_BUCKET = 'logos-empresa';

async function requireAdminOrRh(supabase: ReturnType<typeof createClient>) {
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

export async function listEmpresas() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .is('deleted_at', null)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Erro ao listar empresas:', error);
    return { data: [] as Empresa[], error: error.message };
  }

  return { data: (data || []) as Empresa[], error: null };
}

export async function getEmpresa(id: string): Promise<Empresa | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Erro ao obter empresa:', error);
    return null;
  }

  return data as Empresa;
}

export type EmpresaComLogotipo = Empresa & { logoUrl: string | null };

export async function getEmpresaComLogotipo(
  id: string
): Promise<EmpresaComLogotipo | null> {
  const empresa = await getEmpresa(id);
  if (!empresa) return null;

  let logoUrl: string | null = null;
  if (empresa.logotipo_url) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from(LOGOS_BUCKET)
      .createSignedUrl(empresa.logotipo_url, 3600);
    logoUrl = data?.signedUrl || null;
  }

  return { ...empresa, logoUrl };
}

export async function createEmpresa(
  data: EmpresaFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = empresaSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para criar empresas' };

  const { data: novaEmpresa, error } = await supabase
    .from('empresas')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar empresa:', error);
    return {
      success: false,
      error: `Erro ao guardar na base de dados: ${error.message}${error.details ? ` (${error.details})` : ''}`,
    };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/empresas`);
  return { success: true, id: (novaEmpresa as Empresa).id };
}

export async function updateEmpresa(
  id: string,
  data: EmpresaFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = empresaSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para editar empresas' };

  const { error } = await supabase
    .from('empresas')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    console.error('Erro ao actualizar empresa:', error);
    return { success: false, error: `Erro ao actualizar: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/empresas`);
  revalidatePath(`/${locale}/empresas/${id}`);
  return { success: true };
}

export async function deleteEmpresa(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para eliminar empresas' };

  const { error } = await supabase
    .from('empresas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar empresa:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/empresas`);
  return { success: true };
}

/**
 * Faz upload do logotipo da empresa (storage + actualiza logotipo_url).
 * Recebe um FormData com: file.
 */
export async function uploadLogotipo(
  empresaId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; url?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para gerir logotipos' };

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: 'Seleciona um ficheiro para carregar' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'Ficheiro demasiado grande (máximo 5 MB)' };
  }
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'O logotipo deve ser uma imagem' };
  }

  // Remove logotipo anterior, se existir
  const { data: empresa } = await supabase
    .from('empresas')
    .select('logotipo_url')
    .eq('id', empresaId)
    .single();

  const safeName = fixFilenameEncoding(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${empresaId}/logo-${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGOS_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Erro no upload do logotipo:', uploadError);
    return { success: false, error: `Erro no upload: ${uploadError.message}` };
  }

  // Remove o ficheiro antigo (se apontar para o bucket de logos)
  if (empresa?.logotipo_url?.startsWith(LOGOS_BUCKET)) {
    await supabase.storage.from(LOGOS_BUCKET).remove([empresa.logotipo_url]);
  }

  const { error: updateError } = await supabase
    .from('empresas')
    .update({ logotipo_url: path })
    .eq('id', empresaId);

  if (updateError) {
    await supabase.storage.from(LOGOS_BUCKET).remove([path]);
    console.error('Erro ao actualizar logotipo_url:', updateError);
    return { success: false, error: `Erro ao guardar logotipo: ${updateError.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/empresas/${empresaId}`);
  revalidatePath(`/${locale}/empresas`);
  return { success: true, url: path };
}
