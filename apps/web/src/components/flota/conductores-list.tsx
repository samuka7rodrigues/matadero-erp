'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/config';
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
import { Plus, Trash2, FileDown, AlertCircle, CheckCircle2, UserCog } from 'lucide-react';
import { createConductor, deleteConductor } from '@/actions/flota';
import type { FlotaConductorCompleto } from '@/actions/flota';
import type { FlotaVehiculo } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { nomeColaborador, vehiculoLabel, type ColaboradorOpt } from './utils';
import { MostrarTodos } from '@/components/common/mostrar-todos';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';

interface Props {
  items: FlotaConductorCompleto[];
  vehiculos: FlotaVehiculo[];
  colaboradores: ColaboradorOpt[];
  documentosCount?: Record<string, number>;
}

export function ConductoresList({ items, vehiculos, colaboradores, documentosCount }: Props) {
  const t = useTranslations('Flota.conductores');
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
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [principal, setPrincipal] = useState('no');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!vehiculoId || !colaboradorId || !desde) {
      setError('Veículo, condutor e data são obrigatórios');
      return;
    }

    setSubmitting(true);
    const result = await createConductor({
      vehiculo_id: vehiculoId,
      colaborador_id: colaboradorId,
      asignado_desde: desde,
      asignado_hasta: hasta || null,
      principal: principal === 'si',
    });

    if (!result.success) {
      setError(result.error || tm('erro'));
      setSubmitting(false);
      return;
    }

    setVehiculoId('');
    setColaboradorId('');
    setDesde('');
    setHasta('');
    setPrincipal('no');
    setShowForm(false);
    setSuccess(tm('criado'));
    setSubmitting(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteConductor(id);
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
            <UserCog className="h-4 w-4" />
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
                <Label htmlFor="c-vehiculo">{t('vehiculo')} *</Label>
                <Select id="c-vehiculo" value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)}>
                  <option value="">—</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>{vehiculoLabel(v)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-colaborador">{t('colaborador')} *</Label>
                <Select id="c-colaborador" value={colaboradorId} onChange={(e) => setColaboradorId(e.target.value)}>
                  <option value="">—</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{nomeColaborador(c)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-desde">{t('desde')} *</Label>
                <Input id="c-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-hasta">{t('hasta')}</Label>
                <Input id="c-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-principal">{t('principal')}</Label>
                <Select id="c-principal" value={principal} onChange={(e) => setPrincipal(e.target.value)}>
                  <option value="no">{tc('no')}</option>
                  <option value="si">{tc('yes')}</option>
                </Select>
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
                <TableHead>{t('desde')}</TableHead>
                <TableHead>{t('hasta')}</TableHead>
                <TableHead>{t('principal')}</TableHead>
                <TableHead className="text-center">{td('title')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{vehiculoLabel(c.vehiculos)}</TableCell>
                  <TableCell>{nomeColaborador(c.colaboradores)}</TableCell>
                  <TableCell>{formatDate(c.asignado_desde)}</TableCell>
                  <TableCell>{c.asignado_hasta ? formatDate(c.asignado_hasta) : '—'}</TableCell>
                  <TableCell>
                    {c.principal ? (
                      <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600">✓</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <DocumentoAnexo
                        entidade="flota_conductores"
                        entidadeId={c.id}
                        referencia={vehiculoLabel(c.vehiculos)}
                        count={documentosCount?.[c.id] || 0}
                        iconOnly
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild title="Exportar PDF">
                        <Link href={`/flota/conductores/${c.id}/print`}>
                          <FileDown className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={tc('delete')}
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
          </MostrarTodos>
        )}
      </CardContent>
    </Card>
  );
}
