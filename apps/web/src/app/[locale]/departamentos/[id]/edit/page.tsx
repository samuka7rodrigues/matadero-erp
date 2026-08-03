import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { DepartamentoForm } from '@/components/departamentos/departamento-form';
import { getDepartamento } from '@/actions/departamentos';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditDepartamentoPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('Departamento');
  const departamento = await getDepartamento(id);

  if (!departamento) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">{t('noData')}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">{t('edit')}</h1>
        <DepartamentoForm initialData={departamento} isEditing />
      </div>
    </AppShell>
  );
}
