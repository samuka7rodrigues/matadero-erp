import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { ClienteForm } from '@/components/finanzas/cliente-form';
import { getCliente } from '@/actions/finanzas';

export default async function EditarClientePage({ params }: { params: { id: string } }) {
  const t = await getTranslations('Finanzas');
  const cliente = await getCliente(params.id);

  if (!cliente) notFound();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('clientes.edit')}</h1>
        </div>
        <ClienteForm initialData={cliente} isEditing />
      </div>
    </AppShell>
  );
}
