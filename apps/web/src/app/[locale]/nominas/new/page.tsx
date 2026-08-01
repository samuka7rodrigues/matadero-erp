import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { NominaForm } from '@/components/finanzas/nomina-form';
import { listColaboradores } from '@/actions/colaboradores';

export default async function NovaNominaPage() {
  const t = await getTranslations('Finanzas');
  const { data: colaboradores } = await listColaboradores({ pageSize: 500 });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('nominas.new')}</h1>
        </div>
        <NominaForm colaboradores={colaboradores} />
      </div>
    </AppShell>
  );
}
