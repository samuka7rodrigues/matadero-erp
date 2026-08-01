import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownToLine, ArrowUpFromLine, TrendingDown, Wallet, Receipt } from 'lucide-react';
import { getResumoFinanzas, getFlujoCaja, listDocumentosFinanzas } from '@/actions/finanzas';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getLocale } from 'next-intl/server';
import { DocumentosFinanzasCard } from '@/components/finanzas/documentos-finanzas-card';

export default async function FinanzasPage() {
  const t = await getTranslations('Finanzas');
  const locale = await getLocale();
  const resumo = await getResumoFinanzas();
  const { data: flujo } = await getFlujoCaja();
  const { data: documentos } = await listDocumentosFinanzas();

  const kpis = [
    { label: t('kpis.facturado'), value: resumo.totalFacturado, icon: Receipt, tile: 'bg-white text-primary ring-slate-200' },
    { label: t('kpis.cobrado'), value: resumo.totalCobrado, icon: ArrowDownToLine, tile: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
    { label: t('kpis.pagado'), value: resumo.totalPagado, icon: ArrowUpFromLine, tile: 'bg-amber-50 text-amber-600 ring-amber-100' },
    { label: t('kpis.despesas'), value: resumo.totalDespesas, icon: TrendingDown, tile: 'bg-red-50 text-destructive ring-red-100' },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('resumen')}</h1>
            <p className="text-muted-foreground mt-1">{t('title')}</p>
          </div>
          <Badge variant="outline" className="w-fit gap-1.5 py-1.5">
            <Wallet className="h-3.5 w-3.5" />
            {formatCurrency(resumo.saldo, locale)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="border-slate-200 bg-slate-50 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${kpi.tile}`}>
                  <kpi.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl">
                    {formatCurrency(kpi.value, locale)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">{t('kpis.saldo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight text-emerald-700">
                {formatCurrency(resumo.saldo, locale)}
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4 text-emerald-600" />
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

        <DocumentosFinanzasCard documentos={documentos} />
      </div>
    </AppShell>
  );
}
