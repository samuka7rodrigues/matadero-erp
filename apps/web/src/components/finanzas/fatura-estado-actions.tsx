'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Send } from 'lucide-react';
import { updateFaturaEstado } from '@/actions/finanzas';
import { useTranslations } from 'next-intl';

export function FaturaEstadoActions({ id, estado }: { id: string; estado: string }) {
  const t = useTranslations('Finanzas');
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

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      {estado === 'borrador' && (
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => mudarEstado('emitida')}>
          <Send className="mr-2 h-4 w-4" />
          {t('faturas.marcarEmitida')}
        </Button>
      )}
      {estado === 'emitida' && (
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => mudarEstado('pagada')}>
          <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
          {t('faturas.marcarPagada')}
        </Button>
      )}
      {(estado === 'borrador' || estado === 'emitida') && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => mudarEstado('anulada')}
          className="text-destructive hover:text-destructive"
        >
          <XCircle className="mr-2 h-4 w-4" />
          {t('faturas.anular')}
        </Button>
      )}
    </div>
  );
}
