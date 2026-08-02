import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText } from 'lucide-react';
import { listPresupuestos, deletePresupuesto } from '@/actions/finanzas';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DeleteButton } from '@/components/finanzas/delete-button';
import { MostrarTodos } from '@/components/common/mostrar-todos';

export default async function PresupuestosPage() {
  const t = await getTranslations('Finanzas');
  const locale = await getLocale();
  const { data: presupuestos, error } = await listPresupuestos();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('presupuestos.title')}</h1>
          <Button asChild>
            <Link href="/presupuestos/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('presupuestos.new')}
            </Link>
          </Button>
        </div>

        <Card>
          {error ? (
            <div className="p-6 text-sm text-destructive">Erro: {error}</div>
          ) : presupuestos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('presupuestos.noData')}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/presupuestos/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('presupuestos.new')}
                </Link>
              </Button>
            </div>
          ) : (
            <MostrarTodos count={presupuestos.length}>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('presupuestos.numero')}</TableHead>
                  <TableHead>{t('presupuestos.titulo')}</TableHead>
                  <TableHead>{t('presupuestos.cliente')}</TableHead>
                  <TableHead>{t('presupuestos.data')}</TableHead>
                  <TableHead>{t('presupuestos.estado')}</TableHead>
                  <TableHead className="text-right">{t('presupuestos.total')}</TableHead>
                  <TableHead className="text-right">{t('Common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presupuestos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/presupuestos/${p.id}`} className="font-medium font-mono text-xs hover:underline">
                        {p.numero}
                      </Link>
                    </TableCell>
                    <TableCell>{p.titulo}</TableCell>
                    <TableCell>{p.clientes?.nombre || '—'}</TableCell>
                    <TableCell>{formatDate(p.data, locale)}</TableCell>
                    <TableCell>
                      <Badge variant={p.estado === 'aceito' ? 'success' : p.estado === 'rechazado' ? 'destructive' : 'default'}>
                        {t(`presupuestos.estados.${p.estado}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(Number(p.total), locale)}</TableCell>
                    <TableCell>
                      <DeleteButton id={p.id} confirmMessage={t('presupuestos.confirmDelete')} onDelete={deletePresupuesto} />
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
