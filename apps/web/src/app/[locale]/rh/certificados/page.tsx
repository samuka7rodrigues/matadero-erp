import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { CertificadosList } from '@/components/rh/certificados-list';
import { listCertificados, listColaboradoresAtivos } from '@/actions/rh';

export default async function CertificadosPage() {
  const t = await getTranslations('RH.certificados');
  const [certificadosResult, colaboradores] = await Promise.all([
    listCertificados(),
    listColaboradoresAtivos(),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('dataEmision')}</p>
        </div>
        {certificadosResult.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Erro: {certificadosResult.error}
          </div>
        )}
        <CertificadosList items={certificadosResult.data} colaboradores={colaboradores} />
      </div>
    </AppShell>
  );
}
