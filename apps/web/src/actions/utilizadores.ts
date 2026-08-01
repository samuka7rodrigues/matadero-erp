'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import type { Utilizador, RoleUtilizador } from '@/types/database';

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!utilizador || utilizador.role !== 'admin') return null;
  return user;
}

export interface UtilizadorComColaborador extends Utilizador {
  colaboradores?: {
    nombre: string | null;
    apellido1: string | null;
    apellido2: string | null;
  } | null;
  permissoes_menus?: {
    menus: string[];
  } | null;
}

export async function listUtilizadores() {
  const supabase = createClient();
  const user = await requireAdmin(supabase);
  if (!user) return { data: [] as UtilizadorComColaborador[], error: 'Sem permissão' };

  const { data, error } = await supabase
    .from('utilizadores')
    .select(`*, colaboradores (nombre, apellido1, apellido2), permissoes_menus (menus)`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao listar utilizadores:', error);
    return { data: [] as UtilizadorComColaborador[], error: error.message };
  }
  return { data: (data || []) as UtilizadorComColaborador[], error: null };
}

export async function updateUtilizadorRole(
  userId: string,
  role: RoleUtilizador
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdmin(supabase);
  if (!user) return { success: false, error: 'Sem permissão' };

  const { error } = await supabase
    .from('utilizadores')
    .update({ role })
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao atualizar role:', error);
    return { success: false, error: 'Erro ao atualizar' };
  }

  revalidatePath(`/${await getLocale()}/utilizadores`);
  return { success: true };
}

export async function updateUtilizadorAtivo(
  userId: string,
  ativo: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdmin(supabase);
  if (!user) return { success: false, error: 'Sem permissão' };

  const { error } = await supabase
    .from('utilizadores')
    .update({ ativo })
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao atualizar ativo:', error);
    return { success: false, error: 'Erro ao atualizar' };
  }

  revalidatePath(`/${await getLocale()}/utilizadores`);
  return { success: true };
}

/**
 * Define os menus visíveis de um utilizador.
 * menus == null  -> apaga o registo (volta aos menus padrão do perfil)
 * menus != null  -> upsert do override individual
 */
export async function updateUtilizadorPermissoes(
  userId: string,
  menus: string[] | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdmin(supabase);
  if (!user) return { success: false, error: 'Sem permissão' };

  if (menus === null) {
    const { error } = await supabase
      .from('permissoes_menus')
      .delete()
      .eq('user_id', userId);
    if (error) {
      console.error('Erro ao remover permissões:', error);
      return { success: false, error: 'Erro ao guardar' };
    }
  } else {
    const { error } = await supabase
      .from('permissoes_menus')
      .upsert({ user_id: userId, menus }, { onConflict: 'user_id' });
    if (error) {
      console.error('Erro ao guardar permissões:', error);
      return { success: false, error: 'Erro ao guardar' };
    }
  }

  revalidatePath(`/${await getLocale()}/utilizadores`);
  return { success: true };
}

export async function deleteUtilizador(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdmin(supabase);
  if (!user) return { success: false, error: 'Sem permissão' };

  // Elimina o registo em utilizadores (o auth.users pode ser apagado
  // manualmente no painel do Supabase quando necessário).
  const { error } = await supabase
    .from('utilizadores')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao eliminar utilizador:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/utilizadores`);
  return { success: true };
}

export async function atualizarMeuTelefone(
  telefone: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Sem sessão' };

  // Função SECURITY DEFINER: só atualiza o telefone do próprio utilizador.
  const { error } = await supabase.rpc('atualizar_meu_telefone', {
    p_telefone: telefone,
  });

  if (error) {
    console.error('Erro ao atualizar telefone:', error);
    return { success: false, error: 'Erro ao guardar' };
  }

  revalidatePath(`/${await getLocale()}/perfil`);
  return { success: true };
}

export async function getMeuPerfil() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('utilizadores')
    .select('*, colaboradores (nombre, apellido1, apellido2)')
    .eq('user_id', user.id)
    .single();

  return (data || null) as (UtilizadorComColaborador & { user?: never }) | null;
}
