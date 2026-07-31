'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const locale = await getLocale();

  if (!email || !password) {
    return { error: 'Email e password obrigatórios' };
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Credenciais inválidas' };
  }

  revalidatePath('/', 'layout');
  redirect(`/${locale}/dashboard`);
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
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${locale}/reset-password`,
  });

  if (error) {
    return { error: 'Erro ao enviar email' };
  }

  return { success: 'Email de recuperação enviado' };
}
