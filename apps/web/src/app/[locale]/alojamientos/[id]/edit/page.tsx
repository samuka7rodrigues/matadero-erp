import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { AlojamientoForm } from '@/components/alojamientos/alojamiento-form';
import { getAlojamiento } from '@/actions/alojamiento';
import { listEmpresas } from '@/actions/empresa';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAlojamientoPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('Alojamiento');
  const [alojamiento, { data: empresas }] = await Promise.all([
    getAlojamiento(id),
    listEmpresas(),
  ]);

  if (!alojamiento) notFound();

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('edit')}</h1>
        <AlojamientoForm initialData={alojamiento} isEditing empresas={empresas} />
      </div>
    </AppShell>
  );
}
