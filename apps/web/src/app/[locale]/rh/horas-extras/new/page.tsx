import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { HoraExtraForm } from '@/components/finanzas/hora-extra-form';
import { listColaboradores } from '@/actions/colaboradores';

export default async function NovaHoraExtraPage() {
  const t = await getTranslations('Finanzas');
  const { data: colaboradores } = await listColaboradores({ pageSize: 500 });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('horasExtras.new')}</h1>
        </div>
        <HoraExtraForm colaboradores={colaboradores} />
      </div>
    </AppShell>
  );
}
