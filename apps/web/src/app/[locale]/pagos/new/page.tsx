import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { PagoForm } from '@/components/finanzas/pago-form';

export default async function NovoPagoPage() {
  const t = await getTranslations('Finanzas');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('pagos.new')}</h1>
        </div>
        <PagoForm />
      </div>
    </AppShell>
  );
}
