import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calculator } from 'lucide-react';
import { listNominas, deleteNomina } from '@/actions/finanzas';
import { formatCurrency } from '@/lib/utils';
import { DeleteButton } from '@/components/finanzas/delete-button';
import { NominaEstadoActions } from '@/components/finanzas/nomina-estado-actions';
import { countDocumentos } from '@/actions/documentos';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';

const NOMES_MES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default async function NominasPage() {
  const t = await getTranslations('Finanzas');
  const td = await getTranslations('Documentos');
  const locale = await getLocale();
  const { data: nominas, error } = await listNominas();
  const { documentos } = await countDocumentos('nominas');

  function nomeColaborador(n: { colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null }) {
    const c = n.colaboradores;
    if (!c) return '—';
    return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('nominas.title')}</h1>
          <Button asChild>
                <Link href="/rh/nominas/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('nominas.new')}
            </Link>
          </Button>
        </div>

        <Card>
          {error ? (
            <div className="p-6 text-sm text-destructive">Erro: {error}</div>
          ) : nominas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Calculator className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('nominas.noData')}</p>
              <Button asChild variant="outline" size="sm">
            <Link href="/rh/nominas/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('nominas.new')}
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('nominas.colaborador')}</TableHead>
                  <TableHead>{t('nominas.mes')}</TableHead>
                  <TableHead>{t('nominas.ano')}</TableHead>
                  <TableHead>{t('nominas.salarioBase')}</TableHead>
                  <TableHead className="text-right">{t('nominas.liquido')}</TableHead>
                  <TableHead>{t('nominas.estado')}</TableHead>
                  <TableHead className="text-center">{td('title')}</TableHead>
                  <TableHead className="text-right">{t('Common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nominas.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{nomeColaborador(n)}</TableCell>
                    <TableCell>{NOMES_MES[n.mes - 1]}</TableCell>
                    <TableCell>{n.ano}</TableCell>
                    <TableCell>{formatCurrency(Number(n.salario_base), locale)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(Number(n.liquido), locale)}</TableCell>
                    <TableCell>
                      <Badge variant={n.estado === 'pagada' ? 'success' : n.estado === 'anulada' ? 'destructive' : 'default'}>
                        {t(`nominas.estados.${n.estado}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <DocumentoAnexo
                          entidade="nominas"
                          entidadeId={n.id}
                          referencia={`Nomina ${NOMES_MES[n.mes - 1]} ${n.ano}`}
                          count={documentos[n.id] || 0}
                          iconOnly
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <NominaEstadoActions id={n.id} estado={n.estado} />
                        <DeleteButton id={n.id} confirmMessage={t('nominas.confirmDelete')} onDelete={deleteNomina} />
                      </div>
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
