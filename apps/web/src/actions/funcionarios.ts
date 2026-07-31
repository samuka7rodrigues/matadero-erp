'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { funcionarioSchema, type FuncionarioFormData } from '@/types/funcionarios';
import type { Funcionario } from '@/types/database';

/**
 * Server Actions para gestão de funcionários.
 * Usa o cliente admin (service role) para bypass de RLS em operações específicas
 * e o cliente normal respeitando RLS.
 */

/**
 * Cria um novo funcionário.
 * Permissão: apenas RH ou admin.
 */
export async function createFuncionario(data: FuncionarioFormData): Promise<{
  success: boolean;
  funcionario?: Funcionario;
  error?: string;
}> {
  // Validação
  const parsed = funcionarioSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const adminSupabase = createAdminClient();

  // Verificar permissão (utilizador deve ser RH ou admin)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Não autenticado' };

  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!utilizador || !['admin', 'rh'].includes(utilizador.role)) {
    return { success: false, error: 'Sem permissão para criar funcionários' };
  }

  // Verificar NIF único
  const { data: existing } = await supabase
    .from('funcionarios')
    .select('id')
    .eq('nif', parsed.data.nif)
    .is('deleted_at', null)
    .single();

  if (existing) {
    return { success: false, error: 'Já existe funcionário com este NIF' };
  }

  // Inserir
  const { data: newFuncionario, error } = await supabase
    .from('funcionarios')
    .insert({
      ...parsed.data,
      // Converter salário base do form (mensal) — armazenamos mensal × 14
      salario_base: parsed.data.salario_base,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar funcionário:', error);
    return { success: false, error: 'Erro ao guardar na base de dados' };
  }

  revalidatePath('/funcionarios');
  return { success: true, funcionario: newFuncionario };
}

/**
 * Actualiza funcionário existente.
 */
export async function updateFuncionario(
  id: string,
  data: Partial<FuncionarioFormData>
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

  const { error } = await supabase
    .from('funcionarios')
    .update(data)
    .eq('id', id);

  if (error) {
    return { success: false, error: 'Erro ao actualizar' };
  }

  revalidatePath('/funcionarios');
  revalidatePath(`/funcionarios/${id}`);
  return { success: true };
}

/**
 * Soft-delete (estado = inativo, deleted_at = now).
 */
export async function deleteFuncionario(id: string): Promise<{ success: boolean; error?: string }> {
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
    .from('funcionarios')
    .update({
      estado: 'inativo',
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath('/funcionarios');
  return { success: true };
}

/**
 * Lista funcionários com paginação e busca.
 */
export async function listFuncionarios(params: {
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
    .from('funcionarios')
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

/**
 * Obtém um funcionário por ID.
 */
export async function getFuncionario(id: string): Promise<Funcionario | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('funcionarios')
    .select(`
      *,
      departamentos:departamento_id (nombre, codigo)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Erro ao obter funcionário:', error);
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
