import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { FeriasList } from '@/components/rh/ferias-list';
import { listFerias, listColaboradoresAtivos } from '@/actions/rh';
import { countDocumentos } from '@/actions/documentos';

export default async function FeriasPage() {
  const t = await getTranslations('RH.ferias');
  const [feriasResult, colaboradores, { documentos }] = await Promise.all([
    listFerias(),
    listColaboradoresAtivos(),
    countDocumentos('ferias'),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('solicitadoEm')}</p>
        </div>
        {feriasResult.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Erro: {feriasResult.error}
          </div>
        )}
        <FeriasList items={feriasResult.data} colaboradores={colaboradores} documentosCount={documentos} />
      </div>
    </AppShell>
  );
}
