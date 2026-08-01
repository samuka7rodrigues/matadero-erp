import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/login-form';
import { createClient } from '@/lib/supabase/server';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const { confirmed } = await searchParams;
  const supabase = createClient();

  // Se já estiver autenticado, redireciona para o dashboard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ERP Matadero</CardTitle>
          <CardDescription>Entrar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {confirmed === '1' && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-600">
              Email confirmado com sucesso! Já pode entrar.
            </div>
          )}
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
