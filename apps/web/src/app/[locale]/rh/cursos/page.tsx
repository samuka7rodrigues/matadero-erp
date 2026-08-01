import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { CursosList } from '@/components/rh/cursos-list';
import { listCursos, listColaboradoresAtivos } from '@/actions/rh';

export default async function CursosPage() {
  const t = await getTranslations('RH.cursos');
  const [cursosResult, colaboradores] = await Promise.all([
    listCursos(),
    listColaboradoresAtivos(),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('dataInicio')}</p>
        </div>
        {cursosResult.error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Erro: {cursosResult.error}
          </div>
        )}
        <CursosList items={cursosResult.data} colaboradores={colaboradores} />
      </div>
    </AppShell>
  );
}
