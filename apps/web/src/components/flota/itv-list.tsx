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
import { Plus, Trash2, AlertCircle, CheckCircle2, FileCheck2 } from 'lucide-react';
import { createITV, updateITVResultado, deleteITV } from '@/actions/flota';
import type { FlotaITVCompleto } from '@/actions/flota';
import type { FlotaVehiculo } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { vehiculoLabel } from './utils';
import { MostrarTodos } from '@/components/common/mostrar-todos';

interface Props {
  items: FlotaITVCompleto[];
  vehiculos: FlotaVehiculo[];
}

const RESULTADOS = ['pendiente', 'favorable', 'desfavorable', 'no_presentado'];

export function ITVList({ items, vehiculos }: Props) {
  const t = useTranslations('Flota.itv');
  const tm = useTranslations('Flota.messages');
  const tc = useTranslations('Common');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [vehiculoId, setVehiculoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [validez, setValidez] = useState('');
  const [resultado, setResultado] = useState('pendiente');
  const [centro, setCentro] = useState('');
  const [observacoes, setObservacoes] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehiculoId || !fecha) {
      setError('Veículo e data são obrigatórios');
      return;
    }

    setSubmitting(true);
    const result = await createITV({
      vehiculo_id: vehiculoId,
      fecha,
      fecha_validez: validez || null,
      resultado,
      centro: centro || null,
      observacoes: observacoes || null,
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setVehiculoId('');
    setFecha('');
    setValidez('');
    setResultado('pendiente');
    setCentro('');
    setObservacoes('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleResultado(id: string, r: string) {
    setError(null);
    const result = await updateITVResultado(id, r);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteITV(id);
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
            <FileCheck2 className="h-4 w-4" />
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
                <Label htmlFor="i-vehiculo">{t('vehiculo')} *</Label>
                <Select id="i-vehiculo" value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)}>
                  <option value="">—</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>{vehiculoLabel(v)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-fecha">{t('fecha')} *</Label>
                <Input id="i-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-validez">{t('fechaValidez')}</Label>
                <Input id="i-validez" type="date" value={validez} onChange={(e) => setValidez(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i-resultado">{t('resultado')}</Label>
                <Select id="i-resultado" value={resultado} onChange={(e) => setResultado(e.target.value)}>
                  {RESULTADOS.map((k) => (
                    <option key={k} value={k}>{t(`resultados.${k}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="i-centro">{t('centro')}</Label>
                <Input id="i-centro" value={centro} onChange={(e) => setCentro(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="i-obs">{t('observacoes')}</Label>
                <Input id="i-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
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
          <MostrarTodos count={items.length}>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('vehiculo')}</TableHead>
                <TableHead>{t('fecha')}</TableHead>
                <TableHead>{t('fechaValidez')}</TableHead>
                <TableHead>{t('resultado')}</TableHead>
                <TableHead>{t('centro')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{vehiculoLabel(i.vehiculos)}</TableCell>
                  <TableCell>{formatDate(i.fecha)}</TableCell>
                  <TableCell>{i.fecha_validez ? formatDate(i.fecha_validez) : '—'}</TableCell>
                  <TableCell>
                    <Select
                      value={i.resultado}
                      className="h-8 w-36"
                      onChange={(e) => handleResultado(i.id, e.target.value)}
                    >
                      {RESULTADOS.map((k) => (
                        <option key={k} value={k}>{t(`resultados.${k}`)}</option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>{i.centro || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={tc('delete')}
                        onClick={() => handleDelete(i.id)}
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
          </MostrarTodos>
        )}
      </CardContent>
    </Card>
  );
}
