import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Clock } from 'lucide-react';
import { listHorasExtras, deleteHoraExtra } from '@/actions/finanzas';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DeleteButton } from '@/components/finanzas/delete-button';
import { MostrarTodos } from '@/components/common/mostrar-todos';
import { ExportarHorasExtras } from '@/components/finanzas/exportar-horas-extras';
import { countDocumentos } from '@/actions/documentos';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';

export default async function HorasExtrasPage() {
  const t = await getTranslations('Finanzas');
  const td = await getTranslations('Documentos');
  const locale = await getLocale();
  const { data: horas, error } = await listHorasExtras();
  const { documentos } = await countDocumentos('horas_extras');

  const exportRows = horas.map((h) => ({
    id: h.id,
    colaborador: (() => {
      const c = h.colaboradores;
      return c ? [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ') : '—';
    })(),
    data: h.data,
    horas: Number(h.horas),
    tipo: h.tipo,
    estado: h.estado,
    importe: Number(h.importe),
  }));

  function nomeColaborador(h: { colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null }) {
    const c = h.colaboradores;
    if (!c) return '—';
    return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('horasExtras.title')}</h1>
          <div className="flex items-center gap-2">
            {horas.length > 0 && <ExportarHorasExtras rows={exportRows} />}
            <Button asChild>
              <Link href="/rh/horas-extras/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('horasExtras.new')}
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          {error ? (
            <div className="p-6 text-sm text-destructive">Erro: {error}</div>
          ) : horas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('horasExtras.noData')}</p>
              <Button asChild variant="outline" size="sm">
            <Link href="/rh/horas-extras/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('horasExtras.new')}
                </Link>
              </Button>
            </div>
          ) : (
            <MostrarTodos count={horas.length}>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('horasExtras.colaborador')}</TableHead>
                  <TableHead>{t('horasExtras.data')}</TableHead>
                  <TableHead>{t('horasExtras.horas')}</TableHead>
                  <TableHead>{t('horasExtras.tipo')}</TableHead>
                  <TableHead>{t('horasExtras.estado')}</TableHead>
                  <TableHead className="text-right">{t('horasExtras.importe')}</TableHead>
                  <TableHead className="text-center">{td('title')}</TableHead>
                  <TableHead className="text-right">{t('Common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {horas.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{nomeColaborador(h)}</TableCell>
                    <TableCell>{formatDate(h.data, locale)}</TableCell>
                    <TableCell>{h.horas}h</TableCell>
                    <TableCell className="capitalize">{t(`horasExtras.tipos.${h.tipo}`)}</TableCell>
                    <TableCell>
                      <Badge variant={h.estado === 'pagada' ? 'success' : 'default'}>
                        {t(`horasExtras.estados.${h.estado}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(Number(h.importe), locale)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <DocumentoAnexo
                          entidade="horas_extras"
                          entidadeId={h.id}
                          referencia={`Hora extra ${formatDate(h.data, locale)}`}
                          count={documentos[h.id] || 0}
                          iconOnly
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <DeleteButton id={h.id} confirmMessage={t('horasExtras.confirmDelete')} onDelete={deleteHoraExtra} />
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
