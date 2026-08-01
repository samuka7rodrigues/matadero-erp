import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { DespesaForm } from '@/components/finanzas/despesa-form';
import { listClientes } from '@/actions/finanzas';

export default async function NovaDespesaPage() {
  const t = await getTranslations('Finanzas');
  const { data: clientes } = await listClientes();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('despesas.new')}</h1>
        </div>
        <DespesaForm clientes={clientes} />
      </div>
    </AppShell>
  );
}
