import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { CobroForm } from '@/components/finanzas/cobro-form';
import { listFaturas } from '@/actions/finanzas';

export default async function NovoCobroPage() {
  const t = await getTranslations('Finanzas');
  const { data: faturas } = await listFaturas();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('cobros.new')}</h1>
        </div>
        <CobroForm faturas={faturas} />
      </div>
    </AppShell>
  );
}
