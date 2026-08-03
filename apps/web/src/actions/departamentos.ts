'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { departamentoSchema, type DepartamentoFormData } from '@/types/departamento';

export interface DepartamentoRow {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

async function requireAdminOrRh(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: utilizador } = await supabase
    .from('utilizadores')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!utilizador || !['admin', 'rh'].includes(utilizador.role)) return null;
  return user;
}

export async function listDepartamentosCompleto(): Promise<DepartamentoRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('departamentos')
    .select('id, codigo, nombre, descripcion, activo')
    .order('codigo');

  return (data || []) as DepartamentoRow[];
}

export async function getDepartamento(id: string): Promise<DepartamentoRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('departamentos')
    .select('id, codigo, nombre, descripcion, activo')
    .eq('id', id)
    .single();

  return (data as DepartamentoRow) || null;
}

export async function criarDepartamento(
  data: DepartamentoFormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const parsed = departamentoSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para criar departamentos' };

  const { data: novo, error } = await supabase
    .from('departamentos')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe um departamento com este código' };
    }
    return { success: false, error: `Erro ao guardar na base de dados: ${error.message}` };
  }

  revalidatePath(`/${await getLocale()}/departamentos`);
  return { success: true, id: (novo as DepartamentoRow).id };
}

export async function atualizarDepartamento(
  id: string,
  data: DepartamentoFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = departamentoSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { success: false, error: `Dados inválidos: ${issues}` };
  }

  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para editar departamentos' };

  const { error } = await supabase
    .from('departamentos')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe um departamento com este código' };
    }
    return { success: false, error: `Erro ao atualizar: ${error.message}` };
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/departamentos`);
  revalidatePath(`/${locale}/colaboradores`);
  return { success: true };
}

export async function eliminarDepartamento(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const user = await requireAdminOrRh(supabase);
  if (!user) return { success: false, error: 'Sem permissão para eliminar departamentos' };

  const { error } = await supabase
    .from('departamentos')
    .update({ activo: false })
    .eq('id', id);

  if (error) {
    console.error('Erro ao eliminar departamento:', error);
    return { success: false, error: 'Erro ao eliminar' };
  }

  revalidatePath(`/${await getLocale()}/departamentos`);
  return { success: true };
}
