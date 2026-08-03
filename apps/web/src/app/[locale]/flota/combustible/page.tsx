import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { CombustibleList } from '@/components/flota/combustible-list';
import { listCombustible, listVehiculos } from '@/actions/flota';
import { listColaboradoresAtivos } from '@/actions/rh';
import { countDocumentos } from '@/actions/documentos';

export default async function FlotaCombustiblePage() {
  const t = await getTranslations('Flota.combustible');
  const [items, vehiculos, colaboradores] = await Promise.all([
    listCombustible(),
    listVehiculos(),
    listColaboradoresAtivos(),
  ]);
  const { documentos } = await countDocumentos('flota_combustible');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <CombustibleList items={items} vehiculos={vehiculos} colaboradores={colaboradores} documentosCount={documentos} />
      </div>
    </AppShell>
  );
}
