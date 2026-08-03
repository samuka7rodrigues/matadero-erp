'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Trash2 } from 'lucide-react';
import { exportarDados, limparDadosTeste } from '@/actions/configuracao';
import { useTranslations } from 'next-intl';

export function DadosSection() {
  const t = useTranslations('Configuracao');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function exportar() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await exportarDados();
      if (!result.success || !result.json) {
        setError(result.error || 'Erro ao exportar');
        return;
      }
      const blob = new Blob([result.json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function limpar() {
    if (!window.confirm(t('dados.confirmClean'))) return;
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await limparDadosTeste();
      if (!result.success) {
        setError(result.error || 'Erro ao limpar');
        return;
      }
      setInfo(
        result.eliminados && result.eliminados > 0
          ? t('dados.cleaned') + ` (${result.eliminados})`
          : t('dados.nothing')
      );
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sections.dados')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">{t('dados.exportTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('dados.exportDesc')}</p>
          </div>
          <Button type="button" variant="outline" disabled={isPending} onClick={exportar}>
            <Download className="mr-2 h-4 w-4" />
            {t('dados.exportar')}
          </Button>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-destructive/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">{t('dados.cleanTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('dados.cleanDesc')}</p>
          </div>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={limpar}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('dados.limpar')}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {info && <p className="text-xs text-muted-foreground">{info}</p>}
      </CardContent>
    </Card>
  );
}
