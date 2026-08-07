'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/config';
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
import { Plus, Trash2, FileDown, AlertCircle, CheckCircle2, AlertOctagon } from 'lucide-react';
import { createMulta, updateMultaEstado, deleteMulta } from '@/actions/flota';
import type { FlotaMultaCompleto } from '@/actions/flota';
import type { FlotaVehiculo } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { formatImporte, nomeColaborador, vehiculoLabel, type ColaboradorOpt } from './utils';
import { MostrarTodos } from '@/components/common/mostrar-todos';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';

interface Props {
  items: FlotaMultaCompleto[];
  vehiculos: FlotaVehiculo[];
  colaboradores: ColaboradorOpt[];
  documentosCount?: Record<string, number>;
}

const ESTADOS = ['pendiente', 'pagada', 'recurrida', 'anulada'];

export function MultasList({ items, vehiculos, colaboradores, documentosCount }: Props) {
  const t = useTranslations('Flota.multas');
  const tm = useTranslations('Flota.messages');
  const tc = useTranslations('Common');
  const td = useTranslations('Documentos');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [vehiculoId, setVehiculoId] = useState('');
  const [colaboradorId, setColaboradorId] = useState('');
  const [fecha, setFecha] = useState('');
  const [importe, setImporte] = useState('');
  const [descricao, setDescricao] = useState('');
  const [lugar, setLugar] = useState('');
  const [estado, setEstado] = useState('pendiente');
  const [observacoes, setObservacoes] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehiculoId || !fecha || !importe) {
      setError('Veículo, data e importe são obrigatórios');
      return;
    }

    setSubmitting(true);
    const result = await createMulta({
      vehiculo_id: vehiculoId,
      colaborador_id: colaboradorId || null,
      fecha,
      importe: Number(importe),
      descricao: descricao || null,
      lugar: lugar || null,
      estado,
      observacoes: observacoes || null,
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setVehiculoId('');
    setColaboradorId('');
    setFecha('');
    setImporte('');
    setDescricao('');
    setLugar('');
    setEstado('pendiente');
    setObservacoes('');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleEstado(id: string, e: string) {
    setError(null);
    const result = await updateMultaEstado(id, e);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteMulta(id);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    setSuccess(tm('eliminado'));
    router.refresh();
  }

  function badgeVariant(e: string) {
    if (e === 'pagada') return 'success';
    if (e === 'recurrida') return 'warning';
    if (e === 'anulada') return 'outline';
    return 'destructive';
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4" />
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
                <Label htmlFor="mu-vehiculo">{t('vehiculo')} *</Label>
                <Select id="mu-vehiculo" value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)}>
                  <option value="">—</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>{vehiculoLabel(v)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mu-colaborador">{t('colaborador')}</Label>
                <Select id="mu-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
                  <option value="">—</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{nomeColaborador(c)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mu-fecha">{t('fecha')} *</Label>
                <Input id="mu-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mu-importe">{t('importe')} *</Label>
                <Input id="mu-importe" type="number" step="0.01" value={importe} onChange={(e) => setImporte(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mu-descricao">{t('descricao')}</Label>
                <Input id="mu-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mu-lugar">{t('lugar')}</Label>
                <Input id="mu-lugar" value={lugar} onChange={(e) => setLugar(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mu-estado">{t('estado')}</Label>
                <Select id="mu-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  {ESTADOS.map((k) => (
                    <option key={k} value={k}>{t(`estados.${k}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-4">
                <Label htmlFor="mu-obs">{t('observacoes')}</Label>
                <Input id="mu-obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
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
                <TableHead>{t('colaborador')}</TableHead>
                <TableHead>{t('fecha')}</TableHead>
                <TableHead>{t('importe')}</TableHead>
                <TableHead>{t('descricao')}</TableHead>
                <TableHead>{t('lugar')}</TableHead>
                <TableHead>{t('estado')}</TableHead>
                <TableHead className="text-center">{td('title')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{vehiculoLabel(m.vehiculos)}</TableCell>
                  <TableCell>{nomeColaborador(m.colaboradores)}</TableCell>
                  <TableCell>{formatDate(m.fecha)}</TableCell>
                  <TableCell className="font-medium">{formatImporte(m.importe)}</TableCell>
                  <TableCell>{m.descricao || '—'}</TableCell>
                  <TableCell>{m.lugar || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(m.estado)}>{t(`estados.${m.estado}`) || m.estado}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <DocumentoAnexo
                        entidade="flota_multas"
                        entidadeId={m.id}
                        referencia={vehiculoLabel(m.vehiculos)}
                        count={documentosCount?.[m.id] || 0}
                        iconOnly
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Select
                        value={m.estado}
                        className="h-8 w-32"
                        onChange={(e) => handleEstado(m.id, e.target.value)}
                      >
                        {ESTADOS.map((k) => (
                          <option key={k} value={k}>{t(`estados.${k}`)}</option>
                        ))}
                      </Select>
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
          </MostrarTodos>
        )}
      </CardContent>
    </Card>
  );
}
