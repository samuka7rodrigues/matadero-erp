import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { EpisList } from '@/components/rh/epis-list';
import { listEntregasEPI, listColaboradoresAtivos } from '@/actions/rh';
import { countDocumentos } from '@/actions/documentos';

export default async function EpisPage() {
  const t = await getTranslations('RH.epis');
  const [episResult, colaboradores, { documentos }] = await Promise.all([
    listEntregasEPI(),
    listColaboradoresAtivos(),
    countDocumentos('epis'),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('fechaEntrega')}</p>
        </div>
        {episResult.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Erro: {episResult.error}
          </div>
        )}
        <EpisList items={episResult.data} colaboradores={colaboradores} documentosCount={documentos} />
      </div>
    </AppShell>
  );
}
