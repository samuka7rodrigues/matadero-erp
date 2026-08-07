import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Pencil, Plus, FileDown } from 'lucide-react';
import { getCliente, listFaturas } from '@/actions/finanzas';
import { listDocumentos } from '@/actions/documentos';
import { DocumentosSecao } from '@/components/documentos/documentos-secao';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function ClienteDetalhePage({ params }: { params: { id: string } }) {
  const t = await getTranslations('Finanzas');
  const tc = await getTranslations('Common');
  const locale = await getLocale();
  const cliente = await getCliente(params.id);

  if (!cliente) notFound();

  const { data: faturas } = await listFaturas();
  const faturasCliente = faturas.filter((f) => f.cliente_id === cliente.id);
  const totalFacturado = faturasCliente
    .filter((f) => f.estado !== 'anulada')
    .reduce((s, f) => s + Number(f.total || 0), 0);
  const { data: documentos } = await listDocumentos('clientes', cliente.id);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/finanzas/clientes">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{cliente.nombre}</h1>
              <Badge variant={cliente.estado === 'ativo' ? 'success' : 'secondary'}>
                {cliente.estado === 'ativo' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/finanzas/clientes/${cliente.id}/print`}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/finanzas/clientes/${cliente.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              {tc('edit')}
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('clientes.contacto')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('clientes.cifNif')}</span>
                <span className="font-mono">{cliente.cif_nif || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('clientes.email')}</span>
                <span>{cliente.email || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('clientes.telefono')}</span>
                <span>{cliente.telefono || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('clientes.direccion')}</span>
                <span>{[cliente.direccion, cliente.ciudad, cliente.codigo_postal].filter(Boolean).join(', ') || '—'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('faturas.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('faturas.total')}</span>
                <span className="font-semibold">{formatCurrency(totalFacturado, locale)}</span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/faturas/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('faturas.new')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('faturas.title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {faturasCliente.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">{t('faturas.noData')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('faturas.numero')}</TableHead>
                    <TableHead>{t('faturas.fechaEmision')}</TableHead>
                    <TableHead>{t('faturas.estado')}</TableHead>
                    <TableHead className="text-right">{t('faturas.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faturasCliente.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <Link href={`/faturas/${f.id}`} className="font-medium font-mono text-xs hover:underline">
                          {f.numero}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(f.fecha_emision, locale)}</TableCell>
                      <TableCell>
                        <Badge variant={f.estado === 'pagada' ? 'success' : f.estado === 'emitida' ? 'default' : 'secondary'}>
                          {t(`faturas.estados.${f.estado}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(f.total), locale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <DocumentosSecao entidade="clientes" entidadeId={cliente.id} referencia={cliente.nombre} items={documentos} />
      </div>
    </AppShell>
  );
}
