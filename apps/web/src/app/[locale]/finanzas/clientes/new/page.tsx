import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { ClienteForm } from '@/components/finanzas/cliente-form';

export default async function NovoClientePage() {
  const t = await getTranslations('Finanzas');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('clientes.new')}</h1>
        </div>
        <ClienteForm />
      </div>
    </AppShell>
  );
}
