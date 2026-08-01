import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { MantenimientoList } from '@/components/flota/mantenimiento-list';
import { listMantenimientos, listVehiculos } from '@/actions/flota';

export default async function FlotaMantenimientoPage() {
  const t = await getTranslations('Flota.mantenimiento');
  const [items, vehiculos] = await Promise.all([listMantenimientos(), listVehiculos()]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <MantenimientoList items={items} vehiculos={vehiculos} />
      </div>
    </AppShell>
  );
}
