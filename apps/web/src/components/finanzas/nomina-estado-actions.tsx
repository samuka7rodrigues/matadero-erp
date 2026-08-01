'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { updateNominaEstado } from '@/actions/finanzas';
import { useTranslations } from 'next-intl';

export function NominaEstadoActions({ id, estado }: { id: string; estado: string }) {
  const t = useTranslations('Finanzas');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (estado !== 'calculada') return null;

  function marcarPagada() {
    const fecha = new Date().toISOString().slice(0, 10);
    startTransition(async () => {
      const result = await updateNominaEstado(id, 'pagada', fecha);
      if (!result.success) {
        setError(result.error || 'Erro ao actualizar');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button
        variant="ghost"
        size="icon"
        title={t('nominas.marcarPagada')}
        disabled={isPending}
        onClick={marcarPagada}
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      </Button>
    </div>
  );
}
