import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { VehiculosList } from '@/components/flota/vehiculos-list';
import { listVehiculos } from '@/actions/flota';
import { countDocumentos } from '@/actions/documentos';

export default async function FlotaVehiculosPage() {
  const t = await getTranslations('Flota.vehiculos');
  const items = await listVehiculos();
  const { documentos } = await countDocumentos('flota_vehiculos');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <VehiculosList items={items} documentosCount={documentos} />
      </div>
    </AppShell>
  );
}
