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
import { Plus, Trash2, AlertCircle, CheckCircle2, Wrench } from 'lucide-react';
import { createMantenimiento, deleteMantenimiento } from '@/actions/flota';
import type { FlotaMantenimientoCompleto } from '@/actions/flota';
import type { FlotaVehiculo } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { formatImporte, formatKm, vehiculoLabel } from './utils';

interface Props {
  items: FlotaMantenimientoCompleto[];
  vehiculos: FlotaVehiculo[];
}

const TIPOS = ['correctivo', 'preventivo', 'neumaticos', 'frenos', 'revision', 'otro'];

export function MantenimientoList({ items, vehiculos }: Props) {
  const t = useTranslations('Flota.mantenimiento');
  const tm = useTranslations('Flota.messages');
  const tc = useTranslations('Common');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [vehiculoId, setVehiculoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [tipo, setTipo] = useState('correctivo');
  const [descricao, setDescricao] = useState('');
  const [km, setKm] = useState('');
  const [importe, setImporte] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [observacoes, setObservacoes] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehiculoId || !descricao) {
      setError('Veículo e descrição são obrigatórios');
      return;
    }

    setSubmitting(true);
    const result = await createMantenimiento({
      vehiculo_id: vehiculoId,
      fecha,
      tipo,
      descricao,
      km: km ? Number(km) : null,
      importe: importe ? Number(importe) : null,
      proveedor: proveedor || null,
      observacoes: observacoes || null,
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setVehiculoId('');
    setFecha('');
    setTipo('correctivo');
    setDescricao('');
    setKm('');
    setImporte('');
    setProveedor('');
    setObservacoes('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteMantenimiento(id);
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
            <Wrench className="h-4 w-4" />
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
                <Label htmlFor="m-vehiculo">{t('vehiculo')} *</Label>
                <Select id="m-vehiculo" value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)}>
                  <option value="">—</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>{vehiculoLabel(v)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-fecha">{t('fecha')}</Label>
                <Input id="m-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-tipo">{t('tipo')}</Label>
                <Select id="m-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map((k) => (
                    <option key={k} value={k}>{t(`tipos.${k}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-km">{t('km')}</Label>
                <Input id="m-km" type="number" value={km} onChange={(e) => setKm(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="m-descricao">{t('descricao')} *</Label>
                <Input id="m-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-importe">{t('importe')}</Label>
                <Input id="m-importe" type="number" step="0.01" value={importe} onChange={(e) => setImporte(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-proveedor">{t('proveedor')}</Label>
                <Input id="m-proveedor" value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-4">
                <Label htmlFor="m-obs">{t('observacoes')}</Label>
                <Input id="m-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
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
                <TableHead>{t('tipo')}</TableHead>
                <TableHead>{t('descricao')}</TableHead>
                <TableHead>{t('km')}</TableHead>
                <TableHead>{t('importe')}</TableHead>
                <TableHead>{t('proveedor')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{vehiculoLabel(m.vehiculos)}</TableCell>
                  <TableCell>{m.fecha ? formatDate(m.fecha) : '—'}</TableCell>
                  <TableCell>{t(`tipos.${m.tipo}`) || m.tipo}</TableCell>
                  <TableCell>{m.descricao}</TableCell>
                  <TableCell>{formatKm(m.km)}</TableCell>
                  <TableCell>{formatImporte(m.importe)}</TableCell>
                  <TableCell>{m.proveedor || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={tc('delete')}
                        onClick={() => handleDelete(m.id)}
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
