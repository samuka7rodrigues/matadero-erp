'use client';

import { useRef, useState } from 'react';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Paperclip, Upload, X, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { uploadDocumentos, type EntidadeDocumento } from '@/actions/documentos';
import { useTranslations } from 'next-intl';

const CATEGORIA_OPTIONS = [
  'documento',
  'certificado',
  'informe',
  'recibo',
  'comprovativo',
  'outro',
];

const MAX_FILES = 5;
const ACCEPT_TYPES = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.odt,.ods';

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
  const [files, setFiles] = useState<File[]>([]);
  const [categoria, setCategoria] = useState('documento');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    setSuccess(null);

    const novos = Array.from(list);
    if (files.length + novos.length > MAX_FILES) {
      setError(t('tooManyFiles', { max: String(MAX_FILES) }));
      return;
    }
    setFiles((prev) => [...prev, ...novos]);
  }

  function removeFile(index: number) {
    setError(null);
    setSuccess(null);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (files.length === 0) {
      setError(t('selectFile'));
      return;
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('categoria', categoria);

    const result = await uploadDocumentos(entidade, entidadeId, referencia ?? null, formData);
    setUploading(false);

    if (result.uploaded > 0) {
      setSuccess(t('carregados', { count: String(result.uploaded) }));
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    }

    if (result.erros.length > 0) {
      setError(result.erros.join(' · '));
    } else if (result.uploaded === 0) {
      setError(result.error || t('uploadError'));
    }
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setOpen(false)}
          className="h-6 w-6"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-2 text-xs text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
          <Label htmlFor={`doc-file-${entidadeId}`} className="text-xs">{t('files')}</Label>
          <Input
            id={`doc-file-${entidadeId}`}
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT_TYPES}
            className="h-9 text-xs"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>
      </div>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1.5 text-xs">
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeFile(i)}
                title={t('remove')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">{t('fileTypes')}</p>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={uploading}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {uploading ? tc('loading') : t('send')}
        </Button>
      </div>
    </form>
  );
}
