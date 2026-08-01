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
import { Plus, Trash2, DoorOpen, AlertCircle } from 'lucide-react';
import { createHabitacion, deleteHabitacion } from '@/actions/alojamiento';
import type { Habitacion } from '@/types/database';

const ESTADO_VARIANT: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  livre: 'success',
  ocupada: 'secondary',
  manutencao: 'warning',
  fora_de_uso: 'destructive',
};

export function HabitacionesSection({
  alojamientoId,
  habitaciones,
}: {
  alojamientoId: string;
  habitaciones: Habitacion[];
}) {
  const t = useTranslations('Alojamiento.habitaciones');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [numero, setNumero] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('compartida');
  const [capacidad, setCapacidad] = useState(1);
  const [estado, setEstado] = useState('livre');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!numero.trim()) {
      setError(t('messages.requiredNumero'));
      return;
    }
    setSaving(true);
    const result = await createHabitacion({
      alojamiento_id: alojamientoId,
      numero: numero.trim(),
      nombre: nombre || null,
      tipo: tipo as 'individual' | 'compartida' | 'matrimonial',
      capacidad,
      estado: estado as 'livre' | 'ocupada' | 'manutencao' | 'fora_de_uso',
      observacoes: null,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Erro');
      return;
    }
    setNumero('');
    setNombre('');
    setTipo('compartida');
    setCapacidad(1);
    setEstado('livre');
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    const result = await deleteHabitacion(id, alojamientoId);
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
          <DoorOpen className="h-4 w-4" />
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
            <Label htmlFor="hab-numero">{t('numero')} *</Label>
            <Input id="hab-numero" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="A-101" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hab-nombre">{t('nombre')}</Label>
            <Input id="hab-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hab-tipo">{t('tipo')}</Label>
            <Select id="hab-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="individual">{t('tipoHabitacion.individual')}</option>
              <option value="compartida">{t('tipoHabitacion.compartida')}</option>
              <option value="matrimonial">{t('tipoHabitacion.matrimonial')}</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hab-capacidad">{t('capacidad')}</Label>
            <Input id="hab-capacidad" type="number" min={1} value={capacidad} onChange={(e) => setCapacidad(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hab-estado">{t('estado')}</Label>
            <Select id="hab-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="livre">{t('estados.livre')}</option>
              <option value="ocupada">{t('estados.ocupada')}</option>
              <option value="manutencao">{t('estados.manutencao')}</option>
              <option value="fora_de_uso">{t('estados.fora_de_uso')}</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {saving ? '...' : t('new')}
            </Button>
          </div>
        </form>

        {habitaciones.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('noData')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('numero')}</TableHead>
                <TableHead>{t('nombre')}</TableHead>
                <TableHead>{t('tipo')}</TableHead>
                <TableHead>{t('capacidad')}</TableHead>
                <TableHead>{t('estado')}</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {habitaciones.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-mono">{h.numero}</TableCell>
                  <TableCell>{h.nombre || '—'}</TableCell>
                  <TableCell className="capitalize">{t(`tipoHabitacion.${h.tipo}`)}</TableCell>
                  <TableCell>{h.capacidad}</TableCell>
                  <TableCell>
                    <Badge variant={ESTADO_VARIANT[h.estado] || 'secondary'}>
                      {t(`estados.${h.estado}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t('actions.delete')}
                      onClick={() => handleDelete(h.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
