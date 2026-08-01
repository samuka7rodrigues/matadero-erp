import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, CalendarDays, RefreshCcw, StickyNote, User, Users } from 'lucide-react';
import { getContrato, listContratoDocumentos, listContratoFirmas } from '@/actions/contratos';
import { formatDate } from '@/lib/utils';
import { ContratoDocumentos } from '@/components/contratos/contrato-documentos';
import { ContratoFirmas } from '@/components/contratos/contrato-firmas';

function badgeVariant(estado: string) {
  if (estado === 'ativo') return 'success';
  if (estado === 'vencido') return 'warning';
  if (estado === 'rescindido' || estado === 'anulado') return 'destructive';
  return 'secondary';
}

export default async function ContratoDetalhePage({ params }: { params: { id: string } }) {
  const t = await getTranslations('Contratos');
  const tc = await getTranslations('Common');
  const locale = await getLocale();
  const contrato = await getContrato(params.id);

  if (!contrato) notFound();

  const { data: documentos } = await listContratoDocumentos(contrato.id);
  const { data: firmas } = await listContratoFirmas(contrato.id);

  const colaboradorNombre = contrato.colaboradores
    ? [contrato.colaboradores.nombre, contrato.colaboradores.apellido1, contrato.colaboradores.apellido2]
        .filter(Boolean)
        .join(' ')
    : null;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/contratos">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-mono">{contrato.numero}</h1>
              <Badge variant={badgeVariant(contrato.estado)}>{t(`estados.${contrato.estado}`)}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contrato.estado === 'borrador' && (
              <Button variant="outline" asChild size="sm">
                <Link href={`/contratos/${contrato.id}/edit`}>
                  {tc('edit')}
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('dados.title')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('empresa')}:</span>
                  <span className="font-medium">{contrato.empresas?.nombre_comercial || contrato.empresas?.nombre || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('cliente')}:</span>
                  <span className="font-medium">{contrato.clientes?.nombre || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('colaborador')}:</span>
                  <span className="font-medium">{colaboradorNombre || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('periodo')}:</span>
                  <span className="font-medium">
                    {formatDate(contrato.data_inicio, locale)}
                    {contrato.data_fim ? ` → ${formatDate(contrato.data_fim, locale)}` : ' (indeterminado)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('renovaciones')}:</span>
                  <span className="font-medium">{contrato.renovaciones ?? 0}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{t('renovacionAutomatica')}:</span>
                  <span className="font-medium">{contrato.renovacion_automatica ? tc('yes') : tc('no')}</span>
                </div>
              </CardContent>
            </Card>

            {contrato.observacoes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('observacoes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <StickyNote className="h-4 w-4 mt-0.5 shrink-0" />
                    {contrato.observacoes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <ContratoFirmas contratoId={contrato.id} firmas={firmas} />
        </div>

        <ContratoDocumentos contratoId={contrato.id} documentos={documentos} />
      </div>
    </AppShell>
  );
}
