import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ArrowDownToLine } from 'lucide-react';
import { listCobros } from '@/actions/finanzas';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DeleteButton } from '@/components/finanzas/delete-button';
import { MostrarTodos } from '@/components/common/mostrar-todos';
import { deleteCobro } from '@/actions/finanzas';
import { countDocumentos } from '@/actions/documentos';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';

export default async function CobrosPage() {
  const t = await getTranslations('Finanzas');
  const td = await getTranslations('Documentos');
  const locale = await getLocale();
  const { data: cobros, error } = await listCobros();
  const { documentos } = await countDocumentos('cobros');

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('cobros.title')}</h1>
          <Button asChild>
            <Link href="/cobros/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('cobros.new')}
            </Link>
          </Button>
        </div>

        <Card>
          {error ? (
            <div className="p-6 text-sm text-destructive">Erro: {error}</div>
          ) : cobros.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ArrowDownToLine className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('cobros.noData')}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/cobros/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('cobros.new')}
                </Link>
              </Button>
            </div>
          ) : (
            <MostrarTodos count={cobros.length}>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('cobros.fatura')}</TableHead>
                  <TableHead>{t('cobros.data')}</TableHead>
                  <TableHead>{t('cobros.metodoPago')}</TableHead>
                  <TableHead>{t('cobros.estado')}</TableHead>
                  <TableHead className="text-right">{t('cobros.importe')}</TableHead>
                  <TableHead className="text-center">{td('title')}</TableHead>
                  <TableHead className="text-right">{t('Common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cobros.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.faturas?.numero || '—'}</TableCell>
                    <TableCell>{formatDate(c.data, locale)}</TableCell>
                    <TableCell className="capitalize">{c.metodo_pago}</TableCell>
                    <TableCell>
                      <Badge variant={c.estado === 'registrado' ? 'success' : 'secondary'}>
                        {c.estado === 'registrado' ? t('horasExtras.estados.registrada') : t('faturas.estados.anulada')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">
                      {formatCurrency(Number(c.importe), locale)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <DocumentoAnexo
                          entidade="cobros"
                          entidadeId={c.id}
                          referencia={c.faturas?.numero ? `Fatura ${c.faturas.numero}` : 'Cobro'}
                          count={documentos[c.id] || 0}
                          iconOnly
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <DeleteButton id={c.id} confirmMessage={t('cobros.confirmDelete')} onDelete={deleteCobro} />
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
