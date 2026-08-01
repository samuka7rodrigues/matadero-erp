import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { UtilizadoresList } from '@/components/utilizadores/utilizadores-list';
import { listUtilizadores } from '@/actions/utilizadores';
import { createClient } from '@/lib/supabase/server';

interface UtilizadoresPageProps {
  params: Promise<{ locale: string }>;
}

export default async function UtilizadoresPage({ params }: UtilizadoresPageProps) {
  const { locale } = await params;
  const t = await getTranslations('Utilizadores');

  // Só admin
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: utilizador } = await supabase
      .from('utilizadores')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (!utilizador || utilizador.role !== 'admin') {
      redirect(`/${locale}/dashboard`);
    }
  }

  const result = await listUtilizadores();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        {result.error && result.error !== 'Sem permissão' && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Erro: {result.error}
          </div>
        )}
        <UtilizadoresList items={result.data} />
      </div>
    </AppShell>
  );
}
