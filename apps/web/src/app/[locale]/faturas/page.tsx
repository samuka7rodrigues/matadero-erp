import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Receipt } from 'lucide-react';
import { listFaturas } from '@/actions/finanzas';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FaturaActions } from '@/components/finanzas/fatura-actions';
import { countDocumentos } from '@/actions/documentos';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';

export default async function FaturasPage() {
  const t = await getTranslations('Finanzas');
  const td = await getTranslations('Documentos');
  const locale = await getLocale();
  const { data: faturas, error } = await listFaturas();
  const { documentos } = await countDocumentos('faturas');

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('faturas.title')}</h1>
          <Button asChild>
            <Link href="/faturas/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('faturas.new')}
            </Link>
          </Button>
        </div>

        <Card>
          {error ? (
            <div className="p-6 text-sm text-destructive">Erro: {error}</div>
          ) : faturas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('faturas.noData')}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/faturas/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('faturas.new')}
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('faturas.numero')}</TableHead>
                  <TableHead>{t('faturas.cliente')}</TableHead>
                  <TableHead>{t('faturas.empresa')}</TableHead>
                  <TableHead>{t('faturas.fechaEmision')}</TableHead>
                  <TableHead>{t('faturas.fechaVencimiento')}</TableHead>
                  <TableHead>{t('faturas.estado')}</TableHead>
                  <TableHead className="text-right">{t('faturas.total')}</TableHead>
                  <TableHead className="text-center">{td('title')}</TableHead>
                  <TableHead className="text-right">{t('Common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faturas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Link href={`/faturas/${f.id}`} className="font-medium font-mono text-xs hover:underline">
                        {f.numero}
                      </Link>
                    </TableCell>
                    <TableCell>{f.clientes?.nombre || '—'}</TableCell>
                    <TableCell>{f.empresas?.nombre_comercial || f.empresas?.nombre || '—'}</TableCell>
                    <TableCell>{formatDate(f.fecha_emision, locale)}</TableCell>
                    <TableCell>{f.fecha_vencimiento ? formatDate(f.fecha_vencimiento, locale) : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={f.estado === 'pagada' ? 'success' : f.estado === 'emitida' ? 'default' : 'secondary'}>
                        {t(`faturas.estados.${f.estado}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(Number(f.total), locale)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <DocumentoAnexo
                          entidade="faturas"
                          entidadeId={f.id}
                          referencia={`Fatura ${f.numero}`}
                          count={documentos[f.id] || 0}
                          iconOnly
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <FaturaActions id={f.id} estado={f.estado} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
