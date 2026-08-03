import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ArrowUpFromLine } from 'lucide-react';
import { listPagos, deletePago } from '@/actions/finanzas';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DeleteButton } from '@/components/finanzas/delete-button';
import { MostrarTodos } from '@/components/common/mostrar-todos';
import { countDocumentos } from '@/actions/documentos';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';

export default async function PagosPage() {
  const t = await getTranslations('Finanzas');
  const td = await getTranslations('Documentos');
  const locale = await getLocale();
  const { data: pagos, error } = await listPagos();
  const { documentos } = await countDocumentos('pagos');

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('pagos.title')}</h1>
          <Button asChild>
            <Link href="/pagos/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('pagos.new')}
            </Link>
          </Button>
        </div>

        <Card>
          {error ? (
            <div className="p-6 text-sm text-destructive">Erro: {error}</div>
          ) : pagos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ArrowUpFromLine className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('pagos.noData')}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/pagos/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('pagos.new')}
                </Link>
              </Button>
            </div>
          ) : (
            <MostrarTodos count={pagos.length}>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('pagos.concepto')}</TableHead>
                  <TableHead>{t('pagos.data')}</TableHead>
                  <TableHead>{t('pagos.categoria')}</TableHead>
                  <TableHead>{t('pagos.metodoPago')}</TableHead>
                  <TableHead>{t('pagos.estado')}</TableHead>
                  <TableHead className="text-right">{t('pagos.importe')}</TableHead>
                  <TableHead className="text-center">{td('title')}</TableHead>
                  <TableHead className="text-right">{t('Common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.concepto}</TableCell>
                    <TableCell>{formatDate(p.data, locale)}</TableCell>
                    <TableCell className="capitalize">{p.categoria}</TableCell>
                    <TableCell className="capitalize">{p.metodo_pago}</TableCell>
                    <TableCell>
                      <Badge variant={p.estado === 'registrado' ? 'success' : 'secondary'}>
                        {p.estado === 'registrado' ? t('horasExtras.estados.registrada') : t('faturas.estados.anulada')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {formatCurrency(Number(p.importe), locale)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <DocumentoAnexo
                          entidade="pagos"
                          entidadeId={p.id}
                          referencia={p.concepto || 'Pago'}
                          count={documentos[p.id] || 0}
                          iconOnly
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <DeleteButton id={p.id} confirmMessage={t('pagos.confirmDelete')} onDelete={deletePago} />
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
