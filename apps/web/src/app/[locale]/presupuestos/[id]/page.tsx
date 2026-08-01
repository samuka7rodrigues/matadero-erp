import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import { getPresupuesto, listPresupuestoItens } from '@/actions/finanzas';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function PresupuestoDetalhePage({ params }: { params: { id: string } }) {
  const t = await getTranslations('Finanzas');
  const locale = await getLocale();
  const presupuesto = await getPresupuesto(params.id);

  if (!presupuesto) notFound();

  const { data: itens } = await listPresupuestoItens(presupuesto.id);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/presupuestos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono">{presupuesto.numero}</h1>
            <Badge variant={presupuesto.estado === 'aceito' ? 'success' : presupuesto.estado === 'rechazado' ? 'destructive' : 'default'}>
              {t(`presupuestos.estados.${presupuesto.estado}`)}
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{presupuesto.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">{t('presupuestos.data')}</p>
                <p className="font-medium">{formatDate(presupuesto.data, locale)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('presupuestos.validade')}</p>
                <p className="font-medium">{presupuesto.validade ? formatDate(presupuesto.validade, locale) : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('presupuestos.total')}</p>
                <p className="text-lg font-bold">{formatCurrency(Number(presupuesto.total), locale)}</p>
              </div>
            </div>

            {presupuesto.observacoes && (
              <p className="text-sm text-muted-foreground">{presupuesto.observacoes}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('presupuestos.itens')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('presupuestos.descricao')}</TableHead>
                  <TableHead className="text-right">{t('presupuestos.quantidade')}</TableHead>
                  <TableHead className="text-right">{t('presupuestos.precoUnitario')}</TableHead>
                  <TableHead className="text-right">{t('presupuestos.ivaPct')}</TableHead>
                  <TableHead className="text-right">{t('presupuestos.importe')}</TableHead>
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
                  <TableCell colSpan={4} className="text-right font-bold">{t('presupuestos.total')}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(Number(presupuesto.total), locale)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
