'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { atualizarMeuTelefone } from '@/actions/utilizadores';
import { AlertCircle, CheckCircle2, Pencil } from 'lucide-react';

export function PerfilForm({ telefoneAtual }: { telefoneAtual: string | null }) {
  const t = useTranslations('Perfil');
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [telefone, setTelefone] = useState(telefoneAtual || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSuccess(false);
    const result = await atualizarMeuTelefone(telefone);
    if (!result.success) {
      setError(result.error || t('erro'));
      setLoading(false);
      return;
    }
    setSuccess(true);
    setEditing(false);
    setLoading(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">{telefone || '—'}</span>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="mr-1 h-4 w-4" />
          {t('editar')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          {t('guardado')}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="telefone">{t('telefone')}</Label>
        <Input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? '…' : t('guardar')}
        </Button>
        <Button variant="outline" onClick={() => setEditing(false)}>
          {t('cancelar')}
        </Button>
      </div>
    </div>
  );
}
