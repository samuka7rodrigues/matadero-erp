'use client';

import { useState, useTransition } from 'react';
import { useRouter, Link } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Eye, Play, Trash2, XCircle } from 'lucide-react';
import { updateContratoEstado, deleteContrato } from '@/actions/contratos';
import { useTranslations } from 'next-intl';

export function ContratoActions({ id, estado }: { id: string; estado: string }) {
  const t = useTranslations('Contratos');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function mudarEstado(novoEstado: string) {
    startTransition(async () => {
      const result = await updateContratoEstado(id, novoEstado);
      if (!result.success) {
        setError(result.error || 'Erro ao actualizar');
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm(t('confirmDelete'))) return;
    startTransition(async () => {
      const result = await deleteContrato(id);
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
        <Link href={`/contratos/${id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      {estado === 'borrador' && (
        <Button
          variant="ghost"
          size="icon"
          title={t('marcarAtivo')}
          disabled={isPending}
          onClick={() => mudarEstado('ativo')}
        >
          <Play className="h-4 w-4 text-emerald-600" />
        </Button>
      )}
      {estado === 'ativo' && (
        <Button
          variant="ghost"
          size="icon"
          title={t('finalizar')}
          disabled={isPending}
          onClick={() => mudarEstado('vencido')}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </Button>
      )}
      {(estado === 'ativo' || estado === 'borrador') && (
        <Button
          variant="ghost"
          size="icon"
          title={t('rescindir')}
          disabled={isPending}
          onClick={() => mudarEstado('rescindido')}
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
