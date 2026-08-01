import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownToLine, ArrowUpFromLine, TrendingDown, Wallet, Receipt } from 'lucide-react';
import { getResumoFinanzas, getFlujoCaja } from '@/actions/finanzas';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getLocale } from 'next-intl/server';

export default async function FinanzasPage() {
  const t = await getTranslations('Finanzas');
  const locale = await getLocale();
  const resumo = await getResumoFinanzas();
  const { data: flujo } = await getFlujoCaja();

  const kpis = [
    { label: t('kpis.facturado'), value: resumo.totalFacturado, icon: Receipt, tone: 'text-primary' },
    { label: t('kpis.cobrado'), value: resumo.totalCobrado, icon: ArrowDownToLine, tone: 'text-emerald-600' },
    { label: t('kpis.pagado'), value: resumo.totalPagado, icon: ArrowUpFromLine, tone: 'text-destructive' },
    { label: t('kpis.despesas'), value: resumo.totalDespesas, icon: TrendingDown, tone: 'text-destructive' },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('resumen')}</h1>
          <p className="text-muted-foreground mt-1">{t('title')}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className={`h-4 w-4 ${kpi.tone}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(kpi.value, locale)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('kpis.saldo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">
                {formatCurrency(resumo.saldo, locale)}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                {t('kpis.faturasPendentes')}: {resumo.faturasPendentes}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('flujo.title')}</CardTitle>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto">
              {flujo.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('noData')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('flujo.data')}</TableHead>
                      <TableHead>{t('flujo.tipo')}</TableHead>
                      <TableHead>{t('flujo.concepto')}</TableHead>
                      <TableHead className="text-right">{t('flujo.importe')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flujo.slice(0, 20).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{formatDate(row.data, locale)}</TableCell>
                        <TableCell>
                          <Badge variant={row.tipo === 'entrada' ? 'success' : 'secondary'}>
                            {row.tipo === 'entrada' ? t('flujo.entrada') : t('flujo.salida')}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.concepto}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(row.importe), locale)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
