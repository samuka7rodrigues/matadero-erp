import { getTranslations } from 'next-intl/server';
import { Clock } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-shell';
import { MarcacaoForm } from '@/components/ponto/marcacao-form';
import { ResumoJornadaCard } from '@/components/ponto/resumo-jornada';
import { getMarcacoesHoje, getResumoHoje } from '@/actions/ponto';

export default async function PontoPage() {
  const t = await getTranslations('Ponto');
  const locale = await getLocale();
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const [marcacoesHoje, resumo] = await Promise.all([
    getMarcacoesHoje(),
    getResumoHoje(),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Clock className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        </div>

        <ResumoJornadaCard resumo={resumo} />
        <MarcacaoForm marcacoesHoje={marcacoesHoje} />
      </div>
    </AppShell>
  );
}
