'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, ImagePlus, FileText, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { uploadFotografia, deleteFotografia } from '@/actions/alojamiento-fase2';
import type { FotografiaCompleto, Habitacion } from '@/types/database';

export function FotografiasSection({
  alojamientoId,
  fotografias,
  habitaciones,
}: {
  alojamientoId: string;
  fotografias: (FotografiaCompleto & { signedUrl: string | null })[];
  habitaciones: Habitacion[];
}) {
  const t = useTranslations('Alojamiento.fotografias');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [habitacionId, setHabitacionId] = useState('');
  const [saving, setSaving] = useState(false);

  function isImage(f: { mime_type: string | null }): boolean {
    return !f.mime_type || f.mime_type.startsWith('image/');
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Seleciona uma imagem');
      return;
    }
    setSaving(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('descripcion', descripcion);
    formData.append('habitacion_id', habitacionId);
    const result = await uploadFotografia(alojamientoId, formData);
    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Erro');
      return;
    }
    setFile(null);
    setDescripcion('');
    setHabitacionId('');
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    const result = await deleteFotografia(id, alojamientoId);
    if (!result.success) {
      setError(result.error || 'Erro ao eliminar');
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 items-center gap-3 rounded-md border border-dashed p-4 cursor-pointer hover:bg-muted/50">
              {file ? <FileText className="h-5 w-5 text-muted-foreground shrink-0" /> : <ImagePlus className="h-5 w-5 text-muted-foreground shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{file ? file.name : t('new')}</p>
                <p className="text-xs text-muted-foreground">{t('formato')}</p>
              </div>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="foto-desc">{t('descripcion')}</Label>
              <Input id="foto-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="foto-hab">{t('habitacion')}</Label>
              <Select id="foto-hab" value={habitacionId} onChange={(e) => setHabitacionId(e.target.value)}>
                <option value="">—</option>
                {habitaciones.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.numero}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? '...' : t('new')}
              </Button>
            </div>
          </div>
        </form>

        {fotografias.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('semFoto')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {fotografias.map((f) => (
              <div key={f.id} className="group relative overflow-hidden rounded-lg border">
                {isImage(f) ? (
                  f.signedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.signedUrl}
                      alt={f.descripcion || f.nombre || 'Fotografia'}
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                      ...
                    </div>
                  )
                ) : (
                  <a
                    href={f.signedUrl || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-36 w-full flex-col items-center justify-center gap-2 bg-muted/40 p-3 hover:bg-muted/70"
                  >
                    <FileText className="h-8 w-8 text-primary" />
                    <span className="max-w-full truncate text-xs font-medium">
                      {f.nombre || 'PDF'}
                    </span>
                    {f.signedUrl && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                  </a>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <span className="truncate text-xs text-white">
                    {isImage(f)
                      ? (f.descripcion || (f.habitaciones?.numero ? `Hab. ${f.habitaciones.numero}` : ''))
                      : (f.nombre || 'PDF')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    className="rounded p-1 text-white hover:bg-black/40"
                    title={t('actions.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
