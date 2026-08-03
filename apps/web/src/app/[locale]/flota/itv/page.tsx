import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { ITVList } from '@/components/flota/itv-list';
import { listITVs, listVehiculos } from '@/actions/flota';
import { countDocumentos } from '@/actions/documentos';

export default async function FlotaITVPage() {
  const t = await getTranslations('Flota.itv');
  const [items, vehiculos] = await Promise.all([listITVs(), listVehiculos()]);
  const { documentos } = await countDocumentos('flota_itv');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <ITVList items={items} vehiculos={vehiculos} documentosCount={documentos} />
      </div>
    </AppShell>
  );
}
