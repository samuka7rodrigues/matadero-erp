import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { SegurosList } from '@/components/flota/seguros-list';
import { listSeguros, listVehiculos } from '@/actions/flota';
import { countDocumentos } from '@/actions/documentos';

export default async function FlotaSegurosPage() {
  const t = await getTranslations('Flota.seguros');
  const [items, vehiculos] = await Promise.all([listSeguros(), listVehiculos()]);
  const { documentos } = await countDocumentos('flota_seguros');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <SegurosList items={items} vehiculos={vehiculos} documentosCount={documentos} />
      </div>
    </AppShell>
  );
}
