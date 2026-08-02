import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { ExamesList } from '@/components/rh/exames-list';
import { listExamesMedicos, listColaboradoresAtivos } from '@/actions/rh';
import { countDocumentos } from '@/actions/documentos';

export default async function ExamesPage() {
  const t = await getTranslations('RH.exames');
  const [examesResult, colaboradores, { documentos }] = await Promise.all([
    listExamesMedicos(),
    listColaboradoresAtivos(),
    countDocumentos('exames'),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('fechaExamen')}</p>
        </div>
        {examesResult.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Erro: {examesResult.error}
          </div>
        )}
        <ExamesList items={examesResult.data} colaboradores={colaboradores} documentosCount={documentos} />
      </div>
    </AppShell>
  );
}
