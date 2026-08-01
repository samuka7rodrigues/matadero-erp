import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus } from 'lucide-react';
import { getFatura, listFaturaItens, listCobros } from '@/actions/finanzas';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FaturaEstadoActions } from '@/components/finanzas/fatura-estado-actions';

export default async function FaturaDetalhePage({ params }: { params: { id: string } }) {
  const t = await getTranslations('Finanzas');
  const locale = await getLocale();
  const fatura = await getFatura(params.id);

  if (!fatura) notFound();

  const { data: itens } = await listFaturaItens(fatura.id);
  const { data: cobros } = await listCobros();
  const cobrosFatura = cobros.filter((c) => c.fatura_id === fatura.id);
  const totalCobrado = cobrosFatura.reduce((s, c) => s + Number(c.importe || 0), 0);
  const pendente = Math.max(0, Number(fatura.total) - totalCobrado);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/faturas">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-mono">{fatura.numero}</h1>
              <Badge variant={fatura.estado === 'pagada' ? 'success' : fatura.estado === 'emitida' ? 'default' : 'secondary'}>
                {t(`faturas.estados.${fatura.estado}`)}
              </Badge>
            </div>
          </div>
          <FaturaEstadoActions id={fatura.id} estado={fatura.estado} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('faturas.itens')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('faturas.descricao')}</TableHead>
                    <TableHead className="text-right">{t('faturas.quantidade')}</TableHead>
                    <TableHead className="text-right">{t('faturas.precoUnitario')}</TableHead>
                    <TableHead className="text-right">{t('faturas.ivaPct')}</TableHead>
                    <TableHead className="text-right">{t('faturas.importe')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell className="text-right">{item.quantidade}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(item.preco_unitario), locale)}</TableCell>
                      <TableCell className="text-right">{item.iva_pct}%</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(item.importe), locale)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} />
                    <TableCell className="text-right font-medium">{t('faturas.baseImponible')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(fatura.base_imponible), locale)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} />
                    <TableCell className="text-right font-medium">{t('faturas.iva')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(fatura.iva), locale)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} />
                    <TableCell className="text-right font-bold">{t('faturas.total')}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(Number(fatura.total), locale)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('cobros.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cobrosFatura.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('cobros.noData')}</p>
              ) : (
                <ul className="space-y-2">
                  {cobrosFatura.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span>{formatDate(c.data, locale)}</span>
                      <span className="font-semibold text-emerald-600">{formatCurrency(Number(c.importe), locale)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span>{t('faturas.total')}</span>
                  <span>{formatCurrency(Number(fatura.total), locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cobrado</span>
                  <span className="text-emerald-600">{formatCurrency(totalCobrado, locale)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Pendente</span>
                  <span className={pendente > 0 ? 'text-destructive' : 'text-emerald-600'}>
                    {formatCurrency(pendente, locale)}
                  </span>
                </div>
              </div>

              {fatura.estado !== 'anulada' && (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/cobros/new?fatura=${fatura.id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('cobros.new')}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {fatura.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>{t('faturas.observacoes')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{fatura.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
