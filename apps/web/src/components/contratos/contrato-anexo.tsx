'use client';

import { useRef, useState } from 'react';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Paperclip, Upload, X, AlertCircle } from 'lucide-react';
import { uploadContratoDocumento } from '@/actions/contratos';
import { useTranslations } from 'next-intl';

const CATEGORIA_OPTIONS = [
  { value: 'contrato', labelKey: 'contrato' },
  { value: 'anexo', labelKey: 'anexo' },
  { value: 'clausula', labelKey: 'clausula' },
  { value: 'comprovativo', labelKey: 'comprovativo' },
  { value: 'outro', labelKey: 'outro' },
];

export function ContratoAnexo({ contratoId }: { contratoId: string }) {
  const t = useTranslations('Contratos');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState('contrato');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const result = await uploadContratoDocumento(contratoId, formData);

    if (!result.success) {
      setError(result.error || t('documentos.uploadError'));
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
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Paperclip className="mr-1.5 h-3.5 w-3.5" />
        {t('documentos.attach')}
      </Button>
    );
  }

  return (
    <form onSubmit={handleUpload} className="space-y-2 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">{t('documentos.send')}</p>
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
          <Label htmlFor={`cat-${contratoId}`} className="text-xs">{t('documentos.categoria')}</Label>
          <Select id={`cat-${contratoId}`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(`documentos.categorias.${opt.labelKey}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`file-${contratoId}`} className="text-xs">{t('documentos.file')}</Label>
          <Input
            id={`file-${contratoId}`}
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
          {uploading ? t('Common.loading') : t('documentos.send')}
        </Button>
      </div>
    </form>
  );
}
