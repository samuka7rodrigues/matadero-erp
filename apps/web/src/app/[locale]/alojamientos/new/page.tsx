import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { AlojamientoForm } from '@/components/alojamientos/alojamiento-form';
import { listEmpresas } from '@/actions/empresa';

export default async function NewAlojamientoPage() {
  const t = await getTranslations('Alojamiento');
  const { data: empresas } = await listEmpresas();

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('new')}</h1>
        <AlojamientoForm empresas={empresas} />
      </div>
    </AppShell>
  );
}
