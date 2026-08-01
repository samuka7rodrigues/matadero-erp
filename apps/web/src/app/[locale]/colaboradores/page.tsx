import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { ColaboradoresList } from '@/components/colaboradores/colaboradores-list';
import { ExportarButton } from '@/components/colaboradores/exportar-button';
import { listColaboradores } from '@/actions/colaboradores';

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    estado?: string;
  };
}

export default async function ColaboradoresPage({ searchParams }: PageProps) {
  const t = await getTranslations('Colaboradores');
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';
  const estado = searchParams.estado || '';

  const result = await listColaboradores({ page, pageSize: 25, search, estado });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <div className="flex gap-2">
            <ExportarButton search={search} estado={estado} />
            <Button asChild>
              <Link href="/colaboradores/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('new')}
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <ColaboradoresList
            colaboradores={result.data}
            total={result.total}
            page={result.page}
            pageSize={result.pageSize}
            totalPages={result.totalPages}
          />
        </Card>
      </div>
    </AppShell>
  );
}
