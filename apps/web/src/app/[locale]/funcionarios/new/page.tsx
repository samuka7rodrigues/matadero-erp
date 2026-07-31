import { useTranslations } from 'next-intl';
import { AppShell } from '@/components/app-shell';
import { FuncionarioForm } from '@/components/funcionarios/funcionario-form';
import { listDepartamentos } from '@/actions/funcionarios';

export default function NewFuncionarioPage() {
  const t = useTranslations('Funcionarios');
  const departamentos = await listDepartamentos();

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">{t('new')}</h1>
        <FuncionarioForm departamentos={departamentos} />
      </div>
    </AppShell>
  );
}
