import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { EmpresaForm } from '@/components/empresa/empresa-form';

export default async function NewEmpresaPage() {
  const t = await getTranslations('Empresa');

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('new')}</h1>
        <EmpresaForm />
      </div>
    </AppShell>
  );
}
