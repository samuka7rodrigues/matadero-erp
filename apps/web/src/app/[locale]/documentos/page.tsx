import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FolderOpen, FileText, ExternalLink } from 'lucide-react';
import { listDocumentosGlobal } from '@/actions/documentos';
import { formatDate } from '@/lib/utils';
import { DocumentoEliminar } from '@/components/documentos/documento-eliminar';
import { MostrarTodos } from '@/components/common/mostrar-todos';

export default async function DocumentosPage() {
  const t = await getTranslations('Documentos');
  const tc = await getTranslations('Common');
  const { data: docs, error } = await listDocumentosGlobal();

  const entidadeLabel = (entidade: string) => t(`entidades.${entidade}`) || entidade;

  const totalPorEntidade = docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.entidade] = (acc[d.entidade] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>

        {Object.keys(totalPorEntidade).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(totalPorEntidade).map(([entidade, count]) => (
              <Badge key={entidade} variant="secondary" className="gap-1">
                <FolderOpen className="h-3 w-3" />
                {entidadeLabel(entidade)}: {count}
              </Badge>
            ))}
          </div>
        )}

        <Card>
          {error ? (
            <div className="p-6 text-sm text-destructive">Erro: {error}</div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FolderOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('noData')}</p>
            </div>
          ) : (
            <MostrarTodos count={docs.length}>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('documento')}</TableHead>
                  <TableHead>{t('modulo')}</TableHead>
                  <TableHead>{t('referencia')}</TableHead>
                  <TableHead>{t('categoria')}</TableHead>
                  <TableHead>{t('size')}</TableHead>
                  <TableHead>{t('uploadedAt')}</TableHead>
                  <TableHead className="text-right">{tc('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        <span className="max-w-[260px] truncate text-sm font-medium">{d.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entidadeLabel(d.entidade)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{d.referencia || '—'}</TableCell>
                    <TableCell>{t(`categorias.${d.categoria}`) || d.categoria}</TableCell>
                    <TableCell>{d.archivo_size ? `${(d.archivo_size / 1024).toFixed(0)} KB` : '—'}</TableCell>
                    <TableCell>{formatDate(d.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {d.url && (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                            title={t('download')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <DocumentoEliminar id={d.id} />
                      </div>
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
