import { getTranslations } from 'next-intl/server';
import { Settings } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { getConfiguracao, listFeriados } from '@/actions/configuracao';
import { ConfiguracaoForm } from '@/components/configuracao/configuracao-form';
import { FeriadosManager } from '@/components/configuracao/feriados-manager';
import { DadosSection } from '@/components/configuracao/dados-section';

export default async function ConfiguracoesPage() {
  const t = await getTranslations('Configuracao');
  const [config, feriados] = await Promise.all([getConfiguracao(), listFeriados()]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        </div>

        <ConfiguracaoForm config={config} />
        <FeriadosManager feriados={feriados} />
        <DadosSection />
      </div>
    </AppShell>
  );
}
