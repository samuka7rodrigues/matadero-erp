'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, AlertCircle, CheckCircle2, Gauge } from 'lucide-react';
import { createKilometraje, deleteKilometraje } from '@/actions/flota';
import type { FlotaKilometrajeCompleto } from '@/actions/flota';
import type { FlotaVehiculo } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { formatKm, nomeColaborador, vehiculoLabel, type ColaboradorOpt } from './utils';

interface Props {
  items: FlotaKilometrajeCompleto[];
  vehiculos: FlotaVehiculo[];
  colaboradores: ColaboradorOpt[];
}

export function KilometrajeList({ items, vehiculos, colaboradores }: Props) {
  const t = useTranslations('Flota.kilometraje');
  const tm = useTranslations('Flota.messages');
  const tc = useTranslations('Common');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [vehiculoId, setVehiculoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [km, setKm] = useState('');
  const [colaboradorId, setColaboradorId] = useState('');
  const [observacoes, setObservacoes] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehiculoId || !km) {
      setError('Veículo e quilómetros são obrigatórios');
      return;
    }

    setSubmitting(true);
    const result = await createKilometraje({
      vehiculo_id: vehiculoId,
      fecha,
      km: Number(km),
      colaborador_id: colaboradorId || null,
      observacoes: observacoes || null,
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setVehiculoId('');
    setFecha('');
    setKm('');
    setColaboradorId('');
    setObservacoes('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteKilometraje(id);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    setSuccess(tm('eliminado'));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            {t('title')}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowForm((s) => !s)}>
            <Plus className="mr-1 h-4 w-4" />
            {t('new')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="space-y-3 rounded-md border p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="k-vehiculo">{t('vehiculo')} *</Label>
                <Select id="k-vehiculo" value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)}>
                  <option value="">—</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>{vehiculoLabel(v)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="k-fecha">{t('fecha')}</Label>
                <Input id="k-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="k-km">{t('km')} *</Label>
                <Input id="k-km" type="number" value={km} onChange={(e) => setKm(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="k-colaborador">{t('colaborador')}</Label>
                <Select id="k-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
                  <option value="">—</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{nomeColaborador(c)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-4">
                <Label htmlFor="k-obs">{t('observacoes')}</Label>
                <Input id="k-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{tc('cancel')}</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? tc('loading') : tc('save')}
              </Button>
            </div>
          </form>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('noData')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('vehiculo')}</TableHead>
                <TableHead>{t('fecha')}</TableHead>
                <TableHead>{t('km')}</TableHead>
                <TableHead>{t('colaborador')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{vehiculoLabel(k.vehiculos)}</TableCell>
                  <TableCell>{k.fecha ? formatDate(k.fecha) : '—'}</TableCell>
                  <TableCell>{formatKm(k.km)}</TableCell>
                  <TableCell>{nomeColaborador(k.colaboradores)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={tc('delete')}
                        onClick={() => handleDelete(k.id)}
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
