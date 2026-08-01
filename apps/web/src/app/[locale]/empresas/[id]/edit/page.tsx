import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { EmpresaForm } from '@/components/empresa/empresa-form';
import { getEmpresa } from '@/actions/empresa';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEmpresaPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('Empresa');
  const empresa = await getEmpresa(id);

  if (!empresa) notFound();

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('edit')}</h1>
        <EmpresaForm initialData={empresa} isEditing />
      </div>
    </AppShell>
  );
}
