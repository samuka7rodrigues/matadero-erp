import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { FaturaForm } from '@/components/finanzas/fatura-form';
import { listClientes } from '@/actions/finanzas';
import { listEmpresas } from '@/actions/empresa';

export default async function NovaFaturaPage() {
  const t = await getTranslations('Finanzas');
  const { data: clientes } = await listClientes();
  const { data: empresas } = await listEmpresas();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('faturas.new')}</h1>
        </div>
        <FaturaForm clientes={clientes} empresas={empresas} />
      </div>
    </AppShell>
  );
}
