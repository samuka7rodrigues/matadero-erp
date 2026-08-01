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
import { Users, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createOcupacion, finalizarOcupacion, deleteOcupacion } from '@/actions/alojamiento';
import type { OcupacionCompleto, Habitacion } from '@/types/database';

export function OcupacionSection({
  alojamientoId,
  ocupaciones,
  habitaciones,
  colaboradores,
}: {
  alojamientoId: string;
  ocupaciones: OcupacionCompleto[];
  habitaciones: Habitacion[];
  colaboradores: { id: string; nombre_completo: string }[];
}) {
  const t = useTranslations('Alojamiento.ocupacion');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [colaboradorId, setColaboradorId] = useState('');
  const [habitacionId, setHabitacionId] = useState('');
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().slice(0, 10));
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!colaboradorId) {
      setError(t('messages.requiredColaborador'));
      return;
    }
    setSaving(true);
    const result = await createOcupacion({
      alojamiento_id: alojamientoId,
      habitacion_id: habitacionId || null,
      colaborador_id: colaboradorId,
      data_entrada: new Date(dataEntrada),
      data_saida: null,
      estado: 'ativa',
      observacoes: observacoes || null,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Erro');
      return;
    }
    setColaboradorId('');
    setHabitacionId('');
    setObservacoes('');
    router.refresh();
  }

  async function handleFinalizar(id: string) {
    const result = await finalizarOcupacion(id, alojamientoId);
    if (!result.success) {
      setError(result.error || 'Erro');
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    const result = await deleteOcupacion(id, alojamientoId);
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
          <Users className="h-4 w-4" />
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

        <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="ocp-colaborador">{t('colaborador')} *</Label>
            <Select id="ocp-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
              <option value="">—</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_completo}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ocp-habitacion">{t('habitacion')}</Label>
            <Select id="ocp-habitacion" value={habitacionId} onChange={(e) => setHabitacionId(e.target.value)}>
              <option value="">{t('sinHabitacion')}</option>
              {habitaciones.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.numero}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ocp-entrada">{t('dataEntrada')}</Label>
            <Input id="ocp-entrada" type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ocp-obs">{t('observacoes')}</Label>
            <Input id="ocp-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {saving ? '...' : t('new')}
            </Button>
          </div>
        </form>

        {ocupaciones.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('noData')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('colaborador')}</TableHead>
                <TableHead>{t('habitacion')}</TableHead>
                <TableHead>{t('dataEntrada')}</TableHead>
                <TableHead>{t('dataSaida')}</TableHead>
                <TableHead>{t('estado')}</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ocupaciones.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    {o.colaboradores
                      ? [o.colaboradores.nombre, o.colaboradores.apellido1, o.colaboradores.apellido2]
                          .filter(Boolean)
                          .join(' ')
                      : '—'}
                  </TableCell>
                  <TableCell>{o.habitaciones?.numero || t('sinHabitacion')}</TableCell>
                  <TableCell>{o.data_entrada}</TableCell>
                  <TableCell>{o.data_saida || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={o.estado === 'ativa' ? 'success' : 'secondary'}>
                      {t(`estados.${o.estado}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {o.estado === 'ativa' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('finalizar')}
                          onClick={() => handleFinalizar(o.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('actions.delete')}
                        onClick={() => handleDelete(o.id)}
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
