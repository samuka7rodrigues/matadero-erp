import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { KilometrajeList } from '@/components/flota/kilometraje-list';
import { listKilometrajes, listVehiculos } from '@/actions/flota';
import { listColaboradoresAtivos } from '@/actions/rh';

export default async function FlotaKilometrajePage() {
  const t = await getTranslations('Flota.kilometraje');
  const [items, vehiculos, colaboradores] = await Promise.all([
    listKilometrajes(),
    listVehiculos(),
    listColaboradoresAtivos(),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <KilometrajeList items={items} vehiculos={vehiculos} colaboradores={colaboradores} />
      </div>
    </AppShell>
  );
}
