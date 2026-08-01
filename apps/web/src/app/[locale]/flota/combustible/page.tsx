import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { CombustibleList } from '@/components/flota/combustible-list';
import { listCombustible, listVehiculos } from '@/actions/flota';
import { listColaboradoresAtivos } from '@/actions/rh';

export default async function FlotaCombustiblePage() {
  const t = await getTranslations('Flota.combustible');
  const [items, vehiculos, colaboradores] = await Promise.all([
    listCombustible(),
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
        <CombustibleList items={items} vehiculos={vehiculos} colaboradores={colaboradores} />
      </div>
    </AppShell>
  );
}
