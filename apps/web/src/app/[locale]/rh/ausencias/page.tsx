import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { AusenciasList } from '@/components/rh/ausencias-list';
import { listAusencias, listColaboradoresAtivos } from '@/actions/rh';

export default async function AusenciasPage() {
  const t = await getTranslations('RH.ausencias');
  const [ausenciasResult, colaboradores] = await Promise.all([
    listAusencias(),
    listColaboradoresAtivos(),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('solicitadoEm')}</p>
        </div>
        {ausenciasResult.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Erro: {ausenciasResult.error}
          </div>
        )}
        <AusenciasList items={ausenciasResult.data} colaboradores={colaboradores} />
      </div>
    </AppShell>
  );
}
