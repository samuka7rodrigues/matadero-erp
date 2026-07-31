import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { ColaboradorForm } from '@/components/colaboradores/colaborador-form';
import { getColaborador, listDepartamentos } from '@/actions/colaboradores';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditColaboradorPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('Colaboradores');
  const [colaborador, departamentos] = await Promise.all([
    getColaborador(id),
    listDepartamentos(),
  ]);

  if (!colaborador) notFound();

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">{t('edit')}</h1>
        <ColaboradorForm
          departamentos={departamentos}
          initialData={colaborador}
          isEditing
        />
      </div>
    </AppShell>
  );
}
