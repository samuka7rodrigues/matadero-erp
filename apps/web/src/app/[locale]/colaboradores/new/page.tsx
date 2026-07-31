import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { ColaboradorForm } from '@/components/colaboradores/colaborador-form';
import { listDepartamentos } from '@/actions/colaboradores';

export default async function NewColaboradorPage() {
  const t = await getTranslations('Colaboradores');
  const departamentos = await listDepartamentos();

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">{t('new')}</h1>
        <ColaboradorForm departamentos={departamentos} />
      </div>
    </AppShell>
  );
}
