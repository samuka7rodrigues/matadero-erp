import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/config';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Building2, CalendarDays, FileSignature, Paperclip, PenLine, Plus, User, Users } from 'lucide-react';
import { listContratos, getContratoCounts } from '@/actions/contratos';
import { formatDate } from '@/lib/utils';
import { ContratoAnexo } from '@/components/contratos/contrato-anexo';

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
  const { documentos, firmas } = await getContratoCounts();

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

        {error ? (
          <div className="p-6 text-sm text-destructive">Erro: {error}</div>
        ) : contratos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-card p-12 text-center">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contratos.map((c) => (
              <Card key={c.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <FileSignature className="h-4 w-4" />
                      </span>
                      <Link
                        href={`/contratos/${c.id}`}
                        className="font-mono text-sm font-semibold hover:underline"
                      >
                        {c.numero}
                      </Link>
                    </div>
                    <Badge variant={badgeVariant(c.estado)}>{t(`estados.${c.estado}`)}</Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-muted-foreground">{t('empresa')}:</span>
                      <span className="truncate font-medium">
                        {c.empresas?.nombre_comercial || c.empresas?.nombre || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('colaborador')}:</span>
                      <span className="truncate font-medium">
                        {c.colaboradores
                          ? [c.colaboradores.nombre, c.colaboradores.apellido1, c.colaboradores.apellido2]
                              .filter(Boolean)
                              .join(' ')
                          : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('cliente')}:</span>
                      <span className="truncate font-medium">{c.clientes?.nombre || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium">
                        {formatDate(c.data_inicio, locale)}
                        {c.data_fim ? ` → ${formatDate(c.data_fim, locale)}` : ''}
                      </span>
                    </div>
                    {c.renovaciones ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <PenLine className="h-3.5 w-3.5" />
                        {t('renovaciones')}: {c.renovaciones}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5" />
                      {t('documentosCount', { count: documentos[c.id] || 0 })}
                    </span>
                    <span className="flex items-center gap-1">
                      <PenLine className="h-3.5 w-3.5" />
                      {t('firmasCount', { count: firmas[c.id] || 0 })}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between gap-2 p-5 pt-0">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/contratos/${c.id}`}>{tc('view')}</Link>
                  </Button>
                  <ContratoAnexo contratoId={c.id} />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
