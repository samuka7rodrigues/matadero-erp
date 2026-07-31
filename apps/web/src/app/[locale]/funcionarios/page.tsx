import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, FileDown } from 'lucide-react';
import { FuncionariosList } from '@/components/funcionarios/funcionarios-list';
import { listFuncionarios } from '@/actions/funcionarios';

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    estado?: string;
  };
}

export default async function FuncionariosPage({ searchParams }: PageProps) {
  const t = useTranslations('Funcionarios');
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';
  const estado = searchParams.estado || '';

  const result = await listFuncionarios({ page, pageSize: 25, search, estado });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button asChild>
              <Link href="/funcionarios/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('new')}
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <FuncionariosList
            funcionarios={result.data}
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
