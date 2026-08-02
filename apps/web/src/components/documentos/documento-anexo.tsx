'use client';

import { useRef, useState } from 'react';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Paperclip, Upload, X, AlertCircle } from 'lucide-react';
import { uploadDocumento, type EntidadeDocumento } from '@/actions/documentos';
import { useTranslations } from 'next-intl';

const CATEGORIA_OPTIONS = [
  'documento',
  'certificado',
  'informe',
  'recibo',
  'comprovativo',
  'outro',
];

interface Props {
  entidade: EntidadeDocumento;
  entidadeId: string;
  referencia?: string | null;
  count?: number;
  iconOnly?: boolean;
}

export function DocumentoAnexo({ entidade, entidadeId, referencia, count = 0, iconOnly }: Props) {
  const t = useTranslations('Documentos');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState('documento');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError(t('selectFile'));
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoria', categoria);

    const result = await uploadDocumento(entidade, entidadeId, referencia ?? null, formData);

    if (!result.success) {
      setError(result.error || t('uploadError'));
      setUploading(false);
      return;
    }

    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={iconOnly ? 'relative px-2' : ''}
        title={t('attach')}
      >
        <Paperclip className="h-3.5 w-3.5" />
        {!iconOnly && <span className="ml-1.5">{t('attach')}</span>}
        {count > 0 && (
          <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {count}
          </span>
        )}
      </Button>
    );
  }

  return (
    <form onSubmit={handleUpload} className="space-y-2 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">{t('send')}</p>
        <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-6 w-6">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`doc-cat-${entidadeId}`} className="text-xs">{t('categoria')}</Label>
          <Select id={`doc-cat-${entidadeId}`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIA_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {t(`categorias.${opt}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`doc-file-${entidadeId}`} className="text-xs">{t('file')}</Label>
          <Input
            id={`doc-file-${entidadeId}`}
            ref={fileInputRef}
            type="file"
            className="h-9 text-xs"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={uploading}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {uploading ? tc('loading') : t('send')}
        </Button>
      </div>
    </form>
  );
}
