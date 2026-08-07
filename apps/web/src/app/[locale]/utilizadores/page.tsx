import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
          </div>
          <Button asChild>
            <Link href="/utilizadores/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('new')}
            </Link>
          </Button>
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
