'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSignature, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createContrato, finalizarContrato, deleteContrato } from '@/actions/alojamiento-fase2';
import type { ContratoArrendamentoCompleto, Habitacion } from '@/types/database';

const ESTADO_VARIANT: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  ativo: 'success',
  vencido: 'warning',
  rescindido: 'destructive',
};

export function ContratosSection({
  alojamientoId,
  contratos,
  habitaciones,
  colaboradores,
}: {
  alojamientoId: string;
  contratos: ContratoArrendamentoCompleto[];
  habitaciones: Habitacion[];
  colaboradores: { id: string; nombre_completo: string }[];
}) {
  const t = useTranslations('Alojamiento.contratos');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [codigo, setCodigo] = useState('');
  const [colaboradorId, setColaboradorId] = useState('');
  const [habitacionId, setHabitacionId] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10));
  const [renda, setRenda] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!colaboradorId) {
      setError(t('messages.requiredColaborador'));
      return;
    }
    setSaving(true);
    const result = await createContrato({
      codigo: codigo || null,
      alojamiento_id: alojamientoId,
      habitacion_id: habitacionId || null,
      colaborador_id: colaboradorId,
      data_inicio: new Date(dataInicio),
      data_fim: null,
      renda: renda === '' ? 0 : Number(renda),
      estado: 'ativo',
      observacoes: null,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Erro');
      return;
    }
    setCodigo('');
    setColaboradorId('');
    setHabitacionId('');
    setRenda('');
    router.refresh();
  }

  async function handleFinalizar(id: string) {
    const result = await finalizarContrato(id, alojamientoId);
    if (!result.success) {
      setError(result.error || 'Erro');
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    const result = await deleteContrato(id, alojamientoId);
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
          <FileSignature className="h-4 w-4" />
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

        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5">
            <Label htmlFor="ctr-codigo">{t('codigo')}</Label>
            <Input id="ctr-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="CTR-001" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctr-colaborador">{t('colaborador')} *</Label>
            <Select id="ctr-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
              <option value="">—</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_completo}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctr-hab">{t('habitacion')}</Label>
            <Select id="ctr-hab" value={habitacionId} onChange={(e) => setHabitacionId(e.target.value)}>
              <option value="">—</option>
              {habitaciones.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.numero}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctr-inicio">{t('dataInicio')}</Label>
            <Input id="ctr-inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctr-renda">{t('renda')}</Label>
            <Input id="ctr-renda" type="number" step="0.01" min={0} value={renda} onChange={(e) => setRenda(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {saving ? '...' : t('new')}
            </Button>
          </div>
        </form>

        {contratos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('noData')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('codigo')}</TableHead>
                <TableHead>{t('colaborador')}</TableHead>
                <TableHead>{t('habitacion')}</TableHead>
                <TableHead>{t('dataInicio')}</TableHead>
                <TableHead>{t('dataFim')}</TableHead>
                <TableHead>{t('renda')}</TableHead>
                <TableHead>{t('estado')}</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratos.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.codigo || '—'}</TableCell>
                  <TableCell className="font-medium">
                    {c.colaboradores
                      ? [c.colaboradores.nombre, c.colaboradores.apellido1, c.colaboradores.apellido2]
                          .filter(Boolean)
                          .join(' ')
                      : '—'}
                  </TableCell>
                  <TableCell>{c.habitaciones?.numero || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">{c.data_inicio}</TableCell>
                  <TableCell className="whitespace-nowrap">{c.data_fim || '—'}</TableCell>
                  <TableCell>{c.renda != null ? `${c.renda.toLocaleString()} €` : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={ESTADO_VARIANT[c.estado] || 'secondary'}>
                      {t(`estados.${c.estado}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {c.estado === 'ativo' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('finalizar')}
                          onClick={() => handleFinalizar(c.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('actions.delete')}
                        onClick={() => handleDelete(c.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
