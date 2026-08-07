import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { UtilizadorForm } from '@/components/utilizadores/utilizador-form';

export default async function NewUtilizadorPage() {
  const t = await getTranslations('Utilizadores');

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">{t('new')}</h1>
        <UtilizadorForm />
      </div>
    </AppShell>
  );
}
