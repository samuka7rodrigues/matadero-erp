import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { ContratoForm } from '@/components/contratos/contrato-form';
import { listEmpresas } from '@/actions/empresa';
import { listClientes } from '@/actions/finanzas';
import { listColaboradores } from '@/actions/colaboradores';

export default async function NovoContratoPage() {
  const t = await getTranslations('Contratos');
  const { data: empresas } = await listEmpresas();
  const { data: clientes } = await listClientes();
  const colaboradores = await listColaboradores({ pageSize: 500 });

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('new')}</h1>
        <ContratoForm
          empresas={empresas}
          clientes={clientes}
          colaboradores={colaboradores.data}
        />
      </div>
    </AppShell>
  );
}
