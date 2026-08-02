import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, TrendingDown } from 'lucide-react';
import { listDespesas, deleteDespesa } from '@/actions/finanzas';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DeleteButton } from '@/components/finanzas/delete-button';
import { MostrarTodos } from '@/components/common/mostrar-todos';

export default async function DespesasPage() {
  const t = await getTranslations('Finanzas');
  const locale = await getLocale();
  const { data: despesas, error } = await listDespesas();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('despesas.title')}</h1>
          <Button asChild>
            <Link href="/despesas/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('despesas.new')}
            </Link>
          </Button>
        </div>

        <Card>
          {error ? (
            <div className="p-6 text-sm text-destructive">Erro: {error}</div>
          ) : despesas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <TrendingDown className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('despesas.noData')}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/despesas/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('despesas.new')}
                </Link>
              </Button>
            </div>
          ) : (
            <MostrarTodos count={despesas.length}>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('despesas.concepto')}</TableHead>
                  <TableHead>{t('despesas.cliente')}</TableHead>
                  <TableHead>{t('despesas.categoria')}</TableHead>
                  <TableHead>{t('despesas.data')}</TableHead>
                  <TableHead>{t('despesas.fornecedor')}</TableHead>
                  <TableHead>{t('despesas.estado')}</TableHead>
                  <TableHead className="text-right">{t('despesas.importe')}</TableHead>
                  <TableHead className="text-right">{t('Common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despesas.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.concepto}</TableCell>
                    <TableCell>{d.clientes?.nombre || '—'}</TableCell>
                    <TableCell className="capitalize">{d.categoria}</TableCell>
                    <TableCell>{formatDate(d.data, locale)}</TableCell>
                    <TableCell>{d.fornecedor || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={d.estado === 'registrado' ? 'success' : 'secondary'}>
                        {d.estado === 'registrado' ? t('horasExtras.estados.registrada') : t('faturas.estados.anulada')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {formatCurrency(Number(d.importe), locale)}
                    </TableCell>
                    <TableCell>
                      <DeleteButton id={d.id} confirmMessage={t('despesas.confirmDelete')} onDelete={deleteDespesa} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </MostrarTodos>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
