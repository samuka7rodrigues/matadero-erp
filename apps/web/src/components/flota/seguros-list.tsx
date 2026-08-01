'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { createSeguro, updateSeguroEstado, deleteSeguro } from '@/actions/flota';
import type { FlotaSeguroCompleto } from '@/actions/flota';
import type { FlotaVehiculo } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { formatImporte, vehiculoLabel } from './utils';

interface Props {
  items: FlotaSeguroCompleto[];
  vehiculos: FlotaVehiculo[];
}

const TIPOS = ['basico', 'terceros', 'todo_riesgo', 'otro'];
const ESTADOS = ['activo', 'vencido', 'cancelado'];

export function SegurosList({ items, vehiculos }: Props) {
  const t = useTranslations('Flota.seguros');
  const tm = useTranslations('Flota.messages');
  const tc = useTranslations('Common');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [vehiculoId, setVehiculoId] = useState('');
  const [compania, setCompania] = useState('');
  const [poliza, setPoliza] = useState('');
  const [tipo, setTipo] = useState('basico');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [importe, setImporte] = useState('');
  const [estado, setEstado] = useState('activo');
  const [observacoes, setObservacoes] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehiculoId || !compania) {
      setError('Veículo e companhia são obrigatórios');
      return;
    }

    setSubmitting(true);
    const result = await createSeguro({
      vehiculo_id: vehiculoId,
      compania,
      poliza: poliza || null,
      tipo,
      fecha_inicio: inicio || null,
      fecha_fin: fin || null,
      importe: importe ? Number(importe) : null,
      estado,
      observacoes: observacoes || null,
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setVehiculoId('');
    setCompania('');
    setPoliza('');
    setTipo('basico');
    setInicio('');
    setFin('');
    setImporte('');
    setEstado('activo');
    setObservacoes('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleEstado(id: string, e: string) {
    setError(null);
    const result = await updateSeguroEstado(id, e);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteSeguro(id);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    setSuccess(tm('eliminado'));
    router.refresh();
  }

  function badgeVariant(e: string) {
    if (e === 'activo') return 'success';
    if (e === 'vencido') return 'destructive';
    return 'outline';
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
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
                <Label htmlFor="s-vehiculo">{t('vehiculo')} *</Label>
                <Select id="s-vehiculo" value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)}>
                  <option value="">—</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>{vehiculoLabel(v)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-compania">{t('compania')} *</Label>
                <Input id="s-compania" value={compania} onChange={(e) => setCompania(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-poliza">{t('poliza')}</Label>
                <Input id="s-poliza" value={poliza} onChange={(e) => setPoliza(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-tipo">{t('tipo')}</Label>
                <Select id="s-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map((k) => (
                    <option key={k} value={k}>{t(`tipos.${k}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-inicio">{t('fechaInicio')}</Label>
                <Input id="s-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-fin">{t('fechaFin')}</Label>
                <Input id="s-fin" type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-importe">{t('importe')}</Label>
                <Input id="s-importe" type="number" step="0.01" value={importe} onChange={(e) => setImporte(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-estado">{t('estado')}</Label>
                <Select id="s-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  {ESTADOS.map((k) => (
                    <option key={k} value={k}>{t(`estados.${k}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-4">
                <Label htmlFor="s-obs">{t('observacoes')}</Label>
                <Input id="s-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
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
                <TableHead>{t('compania')}</TableHead>
                <TableHead>{t('poliza')}</TableHead>
                <TableHead>{t('tipo')}</TableHead>
                <TableHead>{t('fechaInicio')}</TableHead>
                <TableHead>{t('fechaFin')}</TableHead>
                <TableHead>{t('importe')}</TableHead>
                <TableHead>{t('estado')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{vehiculoLabel(s.vehiculos)}</TableCell>
                  <TableCell>{s.compania}</TableCell>
                  <TableCell>{s.poliza || '—'}</TableCell>
                  <TableCell>{t(`tipos.${s.tipo}`) || s.tipo}</TableCell>
                  <TableCell>{s.fecha_inicio ? formatDate(s.fecha_inicio) : '—'}</TableCell>
                  <TableCell>{s.fecha_fin ? formatDate(s.fecha_fin) : '—'}</TableCell>
                  <TableCell>{formatImporte(s.importe)}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(s.estado)}>{t(`estados.${s.estado}`) || s.estado}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Select
                        value={s.estado}
                        className="h-8 w-32"
                        onChange={(e) => handleEstado(s.id, e.target.value)}
                      >
                        {ESTADOS.map((k) => (
                          <option key={k} value={k}>{t(`estados.${k}`)}</option>
                        ))}
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={tc('delete')}
                        onClick={() => handleDelete(s.id)}
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
