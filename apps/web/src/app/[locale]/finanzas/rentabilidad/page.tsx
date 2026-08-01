import { getTranslations, getLocale } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartPie } from 'lucide-react';
import { getRentabilidadClientes } from '@/actions/finanzas';
import { formatCurrency } from '@/lib/utils';

export default async function RentabilidadPage() {
  const t = await getTranslations('Finanzas');
  const locale = await getLocale();
  const { data: linhas } = await getRentabilidadClientes();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('rentabilidad.title')}</h1>
        </div>

        <Card>
          <CardContent className="p-0">
            {linhas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <ChartPie className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t('rentabilidad.noData')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('rentabilidad.cliente')}</TableHead>
                    <TableHead className="text-right">{t('rentabilidad.facturado')}</TableHead>
                    <TableHead className="text-right">{t('rentabilidad.cobrado')}</TableHead>
                    <TableHead className="text-right">{t('rentabilidad.costes')}</TableHead>
                    <TableHead className="text-right">{t('rentabilidad.beneficio')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((linha) => (
                    <TableRow key={linha.cliente_id}>
                      <TableCell className="font-medium">{linha.cliente}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(linha.facturado), locale)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(linha.cobrado), locale)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatCurrency(Number(linha.costes), locale)}</TableCell>
                      <TableCell className={`text-right font-semibold ${Number(linha.beneficio) < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {formatCurrency(Number(linha.beneficio), locale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
