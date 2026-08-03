'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import type { FeriadoRow } from '@/actions/configuracao';
import { adicionarFeriado, eliminarFeriado } from '@/actions/configuracao';
import { useTranslations } from 'next-intl';

export function FeriadosManager({ feriados }: { feriados: FeriadoRow[] }) {
  const t = useTranslations('Configuracao');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fecha, setFecha] = useState('');
  const [nombre, setNombre] = useState('');

  function add() {
    setError(null);
    startTransition(async () => {
      const result = await adicionarFeriado({ fecha, nombre });
      if (!result.success) {
        setError(result.error || 'Erro ao adicionar');
        return;
      }
      setFecha('');
      setNombre('');
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm(t('feriados.confirmDelete'))) return;
    startTransition(async () => {
      const result = await eliminarFeriado(id);
      if (!result.success) {
        setError(result.error || 'Erro ao eliminar');
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('feriados.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-3 items-end">
          <div className="space-y-2">
            <Label htmlFor="feriado-fecha">{t('feriados.fecha')}</Label>
            <Input
              id="feriado-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feriado-nombre">{t('feriados.nombre')}</Label>
            <Input
              id="feriado-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t('feriados.nombre')}
            />
          </div>
          <Button
            type="button"
            disabled={isPending || !fecha || !nombre.trim()}
            onClick={add}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('feriados.add')}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {feriados.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('feriados.empty')}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {feriados.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">{f.fecha}</span>
                  <span className="text-sm">{f.nombre}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove(f.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
