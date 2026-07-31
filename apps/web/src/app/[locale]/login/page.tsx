import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/login-form';
import { createClient } from '@/lib/supabase/server';

interface LoginPageProps {
  // Next.js 14+: params é Promise — precisa de await
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
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
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}