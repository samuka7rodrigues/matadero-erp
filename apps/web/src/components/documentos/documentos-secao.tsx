'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Paperclip, FileText, Trash2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { eliminarDocumento, type DocumentoAnexo, type EntidadeDocumento } from '@/actions/documentos';
import { formatDate } from '@/lib/utils';
import { DocumentoAnexo as DocumentoAnexoButton } from '@/components/documentos/documento-anexo';

interface Props {
  entidade: EntidadeDocumento;
  entidadeId: string;
  referencia?: string | null;
  items: Array<DocumentoAnexo & { url: string | null }>;
}

export function DocumentosSecao({ entidade, entidadeId, referencia, items }: Props) {
  const t = useTranslations('Documentos');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    setSuccess(null);
    const result = await eliminarDocumento(id);
    if (!result.success) {
      setError(result.error || 'Erro');
      return;
    }
    setSuccess(t('eliminado'));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Paperclip className="h-4 w-4" />
            {t('title')}
            <span className="text-xs font-normal text-muted-foreground">
              ({items.length})
            </span>
          </CardTitle>
          <DocumentoAnexoButton entidade={entidade} entidadeId={entidadeId} referencia={referencia} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}

        {items.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">{t('noDataEntidade')}</p>
        ) : (
          <ul className="divide-y">
            {items.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 py-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.nombre}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span>{t(`categorias.${doc.categoria}`) || doc.categoria}</span>
                    <span>·</span>
                    <span>{doc.archivo_size ? `${(doc.archivo_size / 1024).toFixed(0)} KB` : '—'}</span>
                    <span>·</span>
                    <span>{formatDate(doc.created_at)}</span>
                  </p>
                </div>
                {doc.url && (
                  <Button asChild variant="ghost" size="icon" title={t('download')}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  title={tc('delete')}
                  onClick={() => handleDelete(doc.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
