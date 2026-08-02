import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { AvaliacoesList } from '@/components/rh/avaliacoes-list';
import { listAvaliacoes, listColaboradoresAtivos } from '@/actions/rh';
import { countDocumentos } from '@/actions/documentos';

export default async function AvaliacoesPage() {
  const t = await getTranslations('RH.avaliacoes');
  const [avaliacoesResult, colaboradores, { documentos }] = await Promise.all([
    listAvaliacoes(),
    listColaboradoresAtivos(),
    countDocumentos('avaliacoes'),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('data')}</p>
        </div>
        {avaliacoesResult.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Erro: {avaliacoesResult.error}
          </div>
        )}
        <AvaliacoesList items={avaliacoesResult.data} colaboradores={colaboradores} documentosCount={documentos} />
      </div>
    </AppShell>
  );
}
