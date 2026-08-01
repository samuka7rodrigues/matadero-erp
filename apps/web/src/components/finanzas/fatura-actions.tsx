'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Send, Trash2 } from 'lucide-react';
import { updateFaturaEstado, deleteFatura } from '@/actions/finanzas';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/config';
import { Eye } from 'lucide-react';

export function FaturaActions({ id, estado }: { id: string; estado: string }) {
  const t = useTranslations('Finanzas');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function mudarEstado(novoEstado: string) {
    startTransition(async () => {
      const result = await updateFaturaEstado(id, novoEstado);
      if (!result.success) {
        setError(result.error || 'Erro ao actualizar');
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm(t('faturas.confirmDelete'))) return;
    startTransition(async () => {
      const result = await deleteFatura(id);
      if (!result.success) {
        setError(result.error || 'Erro ao eliminar');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {error && <span className="text-xs text-destructive mr-1">{error}</span>}
      <Button variant="ghost" size="icon" asChild title={tc('view')}>
        <Link href={`/faturas/${id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      {estado === 'borrador' && (
        <Button
          variant="ghost"
          size="icon"
          title={t('faturas.marcarEmitida')}
          disabled={isPending}
          onClick={() => mudarEstado('emitida')}
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
      {estado === 'emitida' && (
        <Button
          variant="ghost"
          size="icon"
          title={t('faturas.marcarPagada')}
          disabled={isPending}
          onClick={() => mudarEstado('pagada')}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </Button>
      )}
      {(estado === 'borrador' || estado === 'emitida') && (
        <Button
          variant="ghost"
          size="icon"
          title={t('faturas.anular')}
          disabled={isPending}
          onClick={() => mudarEstado('anulada')}
          className="text-destructive hover:text-destructive"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        title={tc('delete')}
        disabled={isPending}
        onClick={handleDelete}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
