'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { uploadDocumentoFinanzas, eliminarDocumentoFinanzas } from '@/actions/finanzas';
import type { DocumentoFinanzas } from '@/types/database';
import { useTranslations } from 'next-intl';

interface Props {
  documentos: Array<DocumentoFinanzas & { url: string | null }>;
}

const CATEGORIA_OPTIONS = [
  { value: 'fatura', labelKey: 'fatura' },
  { value: 'recibo', labelKey: 'recibo' },
  { value: 'contrato', labelKey: 'contrato' },
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

export function DocumentosFinanzasCard({ documentos }: Props) {
  const t = useTranslations('Finanzas');
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState('outro');
  const [descripcion, setDescripcion] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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

    const result = await uploadDocumentoFinanzas(formData);

    if (!result.success) {
      setError(result.error || t('documentos.uploadError'));
      setUploading(false);
      return;
    }

    setFile(null);
    setDescripcion('');
    setExpiresAt('');
    router.refresh();
  }

  async function handleDelete(id: string, nombre: string) {
    if (!window.confirm(`${t('documentos.confirmDelete')} "${nombre}"?`)) return;
    setError(null);
    const result = await eliminarDocumentoFinanzas(id);
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
          <FileText className="h-4 w-4" />
          {t('documentos.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {documentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('documentos.noData')}</p>
        ) : (
          <ul className="divide-y">
            {documentos.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{doc.nombre}</span>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {t(`documentos.categorias.${doc.categoria}`)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(doc.archivo_size)}
                    {doc.descripcion ? ` · ${doc.descripcion}` : ''}
                    {doc.expires_at ? ` · ${t('documentos.validUntil')} ${doc.expires_at}` : ''}
                  </p>
                </div>
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
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleUpload} className="space-y-3 rounded-md border p-3">
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
              {uploading ? t('Common.loading') : t('documentos.upload')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
