'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email e password obrigatórios' };
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Deteta o caso em que o email ainda não foi confirmado
    if (error.message.toLowerCase().includes('confirm')) {
      return { error: 'EMAIL_NOT_CONFIRMED' };
    }
    return { error: 'Credenciais inválidas' };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();

  // Preserva o locale ao redirecionar (ex: /pt-BR/login)
  const locale = await getLocale();
  redirect(`/${locale}/login`);
}

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get('email') as string;
  const locale = await getLocale();

  if (!email) {
    return { error: 'Email obrigatório' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/${locale}/reset-password`,
  });

  if (error) {
    return { error: 'Erro ao enviar email' };
  }

  return { success: 'Email de recuperação enviado' };
}

export async function registerAction(formData: FormData) {
  const nome = (formData.get('nome') as string)?.trim() || '';
  const email = (formData.get('email') as string)?.trim() || '';
  const telefone = (formData.get('telefone') as string)?.trim() || '';
  const password = (formData.get('password') as string) || '';
  const locale = await getLocale();

  if (!nome) return { error: 'Nome obrigatório' };
  if (!email) return { error: 'Email obrigatório' };
  if (password.length < 8) return { error: 'A palavra-passe deve ter pelo menos 8 caracteres' };

  const supabase = createClient();

  // 1. Cria o utilizador em auth.users + envia email de confirmação
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome_completo: nome, telefone },
      emailRedirectTo: `${appUrl()}/${locale}/login?confirmed=1`,
    },
  });

  if (error) {
    console.error('Erro no signUp:', error.message);
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Não foi possível criar a conta' };
  }

  // A linha em utilizadores é criada automaticamente pelo trigger
  // on_auth_user_created (AFTER INSERT ON auth.users), que lê
  // nome_completo e telefone de raw_user_meta_data.

  revalidatePath('/', 'layout');
  return { success: true };
}
