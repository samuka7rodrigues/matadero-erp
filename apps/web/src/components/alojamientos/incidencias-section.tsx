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
import { TriangleAlert, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createIncidencia, resolverIncidencia, deleteIncidencia } from '@/actions/alojamiento-fase2';
import type { IncidenciaCompleto, Habitacion } from '@/types/database';

const ESTADO_VARIANT: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  abierta: 'destructive',
  en_proceso: 'warning',
  resuelta: 'success',
};

const PRIORIDAD_VARIANT: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  baja: 'secondary',
  media: 'warning',
  alta: 'destructive',
};

export function IncidenciasSection({
  alojamientoId,
  incidencias,
  habitaciones,
}: {
  alojamientoId: string;
  incidencias: IncidenciaCompleto[];
  habitaciones: Habitacion[];
}) {
  const t = useTranslations('Alojamiento.incidencias');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState('mantenimiento');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [habitacionId, setHabitacionId] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!descripcion.trim()) {
      setError(t('messages.requiredDescripcion'));
      return;
    }
    setSaving(true);
    const result = await createIncidencia({
      alojamiento_id: alojamientoId,
      habitacion_id: habitacionId || null,
      tipo: tipo as 'mantenimiento' | 'limpieza' | 'otra',
      descripcion: descripcion.trim(),
      prioridad: prioridad as 'baja' | 'media' | 'alta',
      estado: 'abierta',
      observacoes: null,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Erro');
      return;
    }
    setDescripcion('');
    router.refresh();
  }

  async function handleResolver(id: string) {
    const result = await resolverIncidencia(id, alojamientoId);
    if (!result.success) {
      setError(result.error || 'Erro');
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    const result = await deleteIncidencia(id, alojamientoId);
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
          <TriangleAlert className="h-4 w-4" />
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
            <Label htmlFor="inc-tipo">{t('tipo')}</Label>
            <Select id="inc-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="mantenimiento">{t('tipos.mantenimiento')}</option>
              <option value="limpieza">{t('tipos.limpieza')}</option>
              <option value="otra">{t('tipos.otra')}</option>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
            <Label htmlFor="inc-desc">{t('descripcion')} *</Label>
            <Input id="inc-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inc-prioridad">{t('prioridad')}</Label>
            <Select id="inc-prioridad" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
              <option value="baja">{t('prioridades.baja')}</option>
              <option value="media">{t('prioridades.media')}</option>
              <option value="alta">{t('prioridades.alta')}</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inc-hab">{t('habitacion')}</Label>
            <Select id="inc-hab" value={habitacionId} onChange={(e) => setHabitacionId(e.target.value)}>
              <option value="">—</option>
              {habitaciones.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.numero}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {saving ? '...' : t('new')}
            </Button>
          </div>
        </form>

        {incidencias.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('noData')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('fecha')}</TableHead>
                <TableHead>{t('tipo')}</TableHead>
                <TableHead>{t('descripcion')}</TableHead>
                <TableHead>{t('prioridad')}</TableHead>
                <TableHead>{t('estado')}</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidencias.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(i.fecha).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="capitalize">{t(`tipos.${i.tipo}`)}</TableCell>
                  <TableCell className="max-w-[240px]">
                    <span className="line-clamp-2">{i.descripcion}</span>
                    {i.habitaciones?.numero && (
                      <span className="text-xs text-muted-foreground">Hab. {i.habitaciones.numero}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={PRIORIDAD_VARIANT[i.prioridad] || 'secondary'}>
                      {t(`prioridades.${i.prioridad}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ESTADO_VARIANT[i.estado] || 'secondary'}>
                      {t(`estados.${i.estado}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {i.estado !== 'resuelta' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('resolver')}
                          onClick={() => handleResolver(i.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('actions.delete')}
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
        )}
      </CardContent>
    </Card>
  );
}
