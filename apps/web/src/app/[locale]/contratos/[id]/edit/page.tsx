import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { ContratoForm } from '@/components/contratos/contrato-form';
import { getContrato } from '@/actions/contratos';
import { listEmpresas } from '@/actions/empresa';
import { listClientes } from '@/actions/finanzas';
import { listColaboradores } from '@/actions/colaboradores';

export default async function EditarContratoPage({ params }: { params: { id: string } }) {
  const t = await getTranslations('Contratos');
  const contrato = await getContrato(params.id);

  if (!contrato) notFound();

  const { data: empresas } = await listEmpresas();
  const { data: clientes } = await listClientes();
  const colaboradores = await listColaboradores({ pageSize: 500 });

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('edit')}</h1>
        <ContratoForm
          empresas={empresas}
          clientes={clientes}
          colaboradores={colaboradores.data}
          initialData={contrato}
          isEditing
        />
      </div>
    </AppShell>
  );
}
