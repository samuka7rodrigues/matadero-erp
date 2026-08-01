import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSignature, Plus } from 'lucide-react';
import { listContratos } from '@/actions/contratos';
import { formatDate } from '@/lib/utils';
import { ContratoActions } from '@/components/contratos/contrato-actions';

function badgeVariant(estado: string) {
  if (estado === 'ativo') return 'success';
  if (estado === 'vencido') return 'warning';
  if (estado === 'rescindido' || estado === 'anulado') return 'destructive';
  return 'secondary';
}

export default async function ContratosPage() {
  const t = await getTranslations('Contratos');
  const tc = await getTranslations('Common');
  const locale = await getLocale();
  const { data: contratos, error } = await listContratos();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <Button asChild>
            <Link href="/contratos/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('new')}
            </Link>
          </Button>
        </div>

        <Card>
          {error ? (
            <div className="p-6 text-sm text-destructive">Erro: {error}</div>
          ) : contratos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileSignature className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('noData')}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/contratos/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('new')}
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('numero')}</TableHead>
                  <TableHead>{t('empresa')}</TableHead>
                  <TableHead>{t('cliente')}</TableHead>
                  <TableHead>{t('colaborador')}</TableHead>
                  <TableHead>{t('dataInicio')}</TableHead>
                  <TableHead>{t('dataFim')}</TableHead>
                  <TableHead>{t('renovaciones')}</TableHead>
                  <TableHead>{t('estado')}</TableHead>
                  <TableHead className="text-right">{tc('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/contratos/${c.id}`} className="font-mono text-xs font-medium hover:underline">
                        {c.numero}
                      </Link>
                    </TableCell>
                    <TableCell>{c.empresas?.nombre_comercial || c.empresas?.nombre || '—'}</TableCell>
                    <TableCell>{c.clientes?.nombre || '—'}</TableCell>
                    <TableCell>
                      {c.colaboradores
                        ? [c.colaboradores.nombre, c.colaboradores.apellido1, c.colaboradores.apellido2].filter(Boolean).join(' ')
                        : '—'}
                    </TableCell>
                    <TableCell>{formatDate(c.data_inicio, locale)}</TableCell>
                    <TableCell>{c.data_fim ? formatDate(c.data_fim, locale) : '—'}</TableCell>
                    <TableCell>{c.renovaciones ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(c.estado)}>{t(`estados.${c.estado}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <ContratoActions id={c.id} estado={c.estado} />
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
