import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { MultasList } from '@/components/flota/multas-list';
import { listMultas, listVehiculos } from '@/actions/flota';
import { listColaboradoresAtivos } from '@/actions/rh';

export default async function FlotaMultasPage() {
  const t = await getTranslations('Flota.multas');
  const [items, vehiculos, colaboradores] = await Promise.all([
    listMultas(),
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
        <MultasList items={items} vehiculos={vehiculos} colaboradores={colaboradores} />
      </div>
    </AppShell>
  );
}
