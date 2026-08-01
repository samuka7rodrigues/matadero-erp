'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gauge, Plus, Trash2, AlertCircle } from 'lucide-react';
import { createConsumo, deleteConsumo } from '@/actions/alojamiento-fase2';
import type { Consumo } from '@/types/database';

export function ConsumosSection({
  alojamientoId,
  consumos,
}: {
  alojamientoId: string;
  consumos: Consumo[];
}) {
  const t = useTranslations('Alojamiento.consumos');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState('agua');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [leituraAnterior, setLeituraAnterior] = useState('');
  const [leituraAtual, setLeituraAtual] = useState('');
  const [importe, setImporte] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await createConsumo({
      alojamiento_id: alojamientoId,
      tipo: tipo as 'agua' | 'luz' | 'gas' | 'otros',
      data: new Date(data),
      leitura_anterior: leituraAnterior === '' ? 0 : Number(leituraAnterior),
      leitura_atual: leituraAtual === '' ? 0 : Number(leituraAtual),
      importe: importe === '' ? 0 : Number(importe),
      fornecedor: fornecedor || null,
      observacoes: null,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Erro');
      return;
    }
    setLeituraAnterior('');
    setLeituraAtual('');
    setImporte('');
    setFornecedor('');
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    const result = await deleteConsumo(id, alojamientoId);
    if (!result.success) {
      setError(result.error || 'Erro ao eliminar');
      return;
    }
    router.refresh();
  }

  const totalImporte = consumos.reduce((acc, c) => acc + (c.importe ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-4 w-4" />
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

        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-7">
          <div className="space-y-1.5">
            <Label htmlFor="con-tipo">{t('tipo')}</Label>
            <Select id="con-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="agua">{t('tipos.agua')}</option>
              <option value="luz">{t('tipos.luz')}</option>
              <option value="gas">{t('tipos.gas')}</option>
              <option value="otros">{t('tipos.otros')}</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="con-data">{t('data')}</Label>
            <Input id="con-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="con-anterior">{t('leituraAnterior')}</Label>
            <Input id="con-anterior" type="number" step="0.01" min={0} value={leituraAnterior} onChange={(e) => setLeituraAnterior(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="con-atual">{t('leituraAtual')}</Label>
            <Input id="con-atual" type="number" step="0.01" min={0} value={leituraAtual} onChange={(e) => setLeituraAtual(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="con-importe">{t('importe')}</Label>
            <Input id="con-importe" type="number" step="0.01" min={0} value={importe} onChange={(e) => setImporte(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="con-fornecedor">{t('fornecedor')}</Label>
            <Input id="con-fornecedor" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {saving ? '...' : t('new')}
            </Button>
          </div>
        </form>

        {consumos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('noData')}</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('data')}</TableHead>
                  <TableHead>{t('tipo')}</TableHead>
                  <TableHead>{t('leituraAnterior')}</TableHead>
                  <TableHead>{t('leituraAtual')}</TableHead>
                  <TableHead>{t('consumo')}</TableHead>
                  <TableHead>{t('importe')}</TableHead>
                  <TableHead>{t('fornecedor')}</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumos.map((c) => {
                  const consumo =
                    c.leitura_atual != null && c.leitura_anterior != null
                      ? c.leitura_atual - c.leitura_anterior
                      : null;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="whitespace-nowrap">{c.data}</TableCell>
                      <TableCell className="capitalize">{t(`tipos.${c.tipo}`)}</TableCell>
                      <TableCell className="font-mono text-xs">{c.leitura_anterior ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{c.leitura_atual ?? '—'}</TableCell>
                      <TableCell className="font-medium">{consumo ?? '—'}</TableCell>
                      <TableCell>{c.importe != null ? `${c.importe.toLocaleString()} €` : '—'}</TableCell>
                      <TableCell>{c.fornecedor || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('actions.delete')}
                          onClick={() => handleDelete(c.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex justify-end border-t pt-3 text-sm">
              <span className="text-muted-foreground">Total importes:</span>
              <span className="ml-2 font-bold">{totalImporte.toLocaleString()} €</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
