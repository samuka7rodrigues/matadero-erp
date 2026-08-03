import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { DepartamentoForm } from '@/components/departamentos/departamento-form';

export default async function NewDepartamentoPage() {
  const t = await getTranslations('Departamento');

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">{t('new')}</h1>
        <DepartamentoForm />
      </div>
    </AppShell>
  );
}
