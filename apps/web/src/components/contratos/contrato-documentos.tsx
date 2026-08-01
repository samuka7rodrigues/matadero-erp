'use client';

import { useRef, useState } from 'react';
import { useRouter } from '@/i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  FileSignature,
  FileImage,
  File as FileIcon,
  Upload,
  Trash2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { uploadContratoDocumento, eliminarContratoDocumento } from '@/actions/contratos';
import type { ContratoDocumento } from '@/types/database';
import { useTranslations } from 'next-intl';

interface Props {
  contratoId: string;
  documentos: Array<ContratoDocumento & { url: string | null }>;
}

const CATEGORIA_OPTIONS = [
  { value: 'contrato', labelKey: 'contrato' },
  { value: 'anexo', labelKey: 'anexo' },
  { value: 'clausula', labelKey: 'clausula' },
  { value: 'comprovativo', labelKey: 'comprovativo' },
  { value: 'outro', labelKey: 'outro' },
];

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function fileIcon(mimeType: string | null) {
  if (mimeType && mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType && mimeType.includes('word')) return FileText;
  return FileIcon;
}

export function ContratoDocumentos({ contratoId, documentos }: Props) {
  const t = useTranslations('Contratos');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState('contrato');
  const [descripcion, setDescripcion] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError(t('documentos.selectFile'));
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoria', categoria);
    if (descripcion) formData.append('descripcion', descripcion);
    if (expiresAt) formData.append('expires_at', expiresAt);

    const result = await uploadContratoDocumento(contratoId, formData);

    if (!result.success) {
      setError(result.error || t('documentos.uploadError'));
      setUploading(false);
      return;
    }

    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setDescripcion('');
    setExpiresAt('');
    setSuccess(t('documentos.uploadSuccess'));
    setUploading(false);
    router.refresh();
  }

  async function handleDelete(id: string, nombre: string) {
    if (!window.confirm(`${t('documentos.confirmDelete')} "${nombre}"?`)) return;
    setError(null);
    setSuccess(null);
    const result = await eliminarContratoDocumento(id);
    if (!result.success) {
      setError(result.error || t('documentos.deleteError'));
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-4 w-4" />
          {t('documentos.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {documentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('documentos.noData')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documentos.map((doc) => {
              const Icon = fileIcon(doc.mime_type);
              return (
                <div
                  key={doc.id}
                  className="flex flex-col justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={doc.nombre}>{doc.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(doc.archivo_size)}
                        {doc.expires_at ? ` · ${t('documentos.validUntil')} ${doc.expires_at}` : ''}
                      </p>
                      {doc.descripcion && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{doc.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {t(`documentos.categorias.${doc.categoria}`)}
                    </Badge>
                    <div className="flex shrink-0 items-center gap-1">
                      {doc.url && (
                        <Button variant="outline" size="icon" asChild title={t('documentos.view')}>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('documentos.delete')}
                        onClick={() => handleDelete(doc.id, doc.nombre)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">{t('documentos.send')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="doc-categoria">{t('documentos.categoria')}</Label>
              <Select id="doc-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {CATEGORIA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(`documentos.categorias.${opt.labelKey}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="doc-descricao">{t('documentos.descripcion')}</Label>
              <Input
                id="doc-descricao"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder={t('documentos.descripcionPlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-file">{t('documentos.file')} *</Label>
              <Input
                id="doc-file"
                ref={fileInputRef}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-expira">{t('documentos.validUntil')}</Label>
              <Input
                id="doc-expira"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? tc('loading') : t('documentos.send')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
