'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle } from 'lucide-react';
import { eliminarDocumentoMenu, type DocumentoOrigem } from '@/actions/documentos';

export function DocumentoEliminar({ id, origem = 'documentos' }: { id: string; origem?: DocumentoOrigem }) {
  const t = useTranslations('Documentos');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await eliminarDocumentoMenu(id, origem);
    if (!result.success) {
      setError(result.error || 'Erro');
      return;
    }
    router.refresh();
  }

  return (
    <>
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        title={tc('delete')}
        onClick={handleDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );
}
