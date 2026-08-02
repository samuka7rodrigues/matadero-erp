import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { AdvertenciasList } from '@/components/rh/advertencias-list';
import { listAdvertencias, listColaboradoresAtivos } from '@/actions/rh';
import { countDocumentos } from '@/actions/documentos';

export default async function AdvertenciasPage() {
  const t = await getTranslations('RH.advertencias');
  const [advertenciasResult, colaboradores, { documentos }] = await Promise.all([
    listAdvertencias(),
    listColaboradoresAtivos(),
    countDocumentos('advertencias'),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('data')}</p>
        </div>
        {advertenciasResult.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Erro: {advertenciasResult.error}
          </div>
        )}
        <AdvertenciasList items={advertenciasResult.data} colaboradores={colaboradores} documentosCount={documentos} />
      </div>
    </AppShell>
  );
}
