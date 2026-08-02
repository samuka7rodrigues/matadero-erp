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
import { Plus, Trash2, Pencil, AlertCircle, CheckCircle2, Truck } from 'lucide-react';
import { createVehiculo, updateVehiculo, deleteVehiculo } from '@/actions/flota';
import type { FlotaVehiculo } from '@/types/database';
import { MostrarTodos } from '@/components/common/mostrar-todos';
import { DocumentoAnexo } from '@/components/documentos/documento-anexo';

interface Props {
  items: FlotaVehiculo[];
  documentosCount?: Record<string, number>;
}

const TIPOS = ['coche', 'furgoneta', 'camion', 'moto', 'otro'];
const ESTADOS = ['activo', 'en_taller', 'baja'];

const EMPTY = {
  matricula: '',
  marca: '',
  modelo: '',
  tipo: 'furgoneta',
  ano: '',
  km_actuales: '',
  estado: 'activo',
  fecha_compra: '',
  observacoes: '',
};

export function VehiculosList({ items, documentosCount }: Props) {
  const t = useTranslations('Flota.vehiculos');
  const tm = useTranslations('Flota.messages');
  const tc = useTranslations('Common');
  const td = useTranslations('Documentos');
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(v: FlotaVehiculo) {
    setError(null);
    setSuccess(null);
    setForm({
      matricula: v.matricula,
      marca: v.marca,
      modelo: v.modelo,
      tipo: v.tipo,
      ano: v.ano != null ? String(v.ano) : '',
      km_actuales: v.km_actuales != null ? String(v.km_actuales) : '',
      estado: v.estado,
      fecha_compra: v.fecha_compra || '',
      observacoes: v.observacoes || '',
    });
    setEditing(v.id);
    setShowForm(true);
  }

  function startCreate() {
    setError(null);
    setSuccess(null);
    setForm({ ...EMPTY });
    setEditing(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.matricula || !form.marca || !form.modelo) {
      setError(t('matricula') + ', ' + t('marca') + ' e ' + t('modelo') + ' são obrigatórios');
      return;
    }
    setSubmitting(true);
    const values = {
      matricula: form.matricula,
      marca: form.marca,
      modelo: form.modelo,
      tipo: form.tipo,
      ano: form.ano ? Number(form.ano) : null,
      km_actuales: form.km_actuales ? Number(form.km_actuales) : null,
      estado: form.estado,
      fecha_compra: form.fecha_compra || null,
      observacoes: form.observacoes || null,
    };
    const result = editing
      ? await updateVehiculo(editing, values)
      : await createVehiculo(values);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || tm('erro'));
      return;
    }
    setShowForm(false);
    setEditing(null);
    setSuccess(editing ? tm('atualizado') : tm('criado'));
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    setError(null);
    const result = await deleteVehiculo(id);
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
            <Truck className="h-4 w-4" />
            {t('title')}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={startCreate}>
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
          <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="v-matricula">{t('matricula')} *</Label>
                <Input id="v-matricula" value={form.matricula} onChange={(e) => set('matricula', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-marca">{t('marca')} *</Label>
                <Input id="v-marca" value={form.marca} onChange={(e) => set('marca', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-modelo">{t('modelo')} *</Label>
                <Input id="v-modelo" value={form.modelo} onChange={(e) => set('modelo', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-tipo">{t('tipo')}</Label>
                <Select id="v-tipo" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
                  {TIPOS.map((k) => (
                    <option key={k} value={k}>{t(`tipos.${k}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-ano">{t('ano')}</Label>
                <Input id="v-ano" type="number" value={form.ano} onChange={(e) => set('ano', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-km">{t('km')}</Label>
                <Input id="v-km" type="number" value={form.km_actuales} onChange={(e) => set('km_actuales', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-estado">{t('estado')}</Label>
                <Select id="v-estado" value={form.estado} onChange={(e) => set('estado', e.target.value)}>
                  {ESTADOS.map((k) => (
                    <option key={k} value={k}>{t(`estados.${k}`)}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-fecha">{t('fechaCompra')}</Label>
                <Input id="v-fecha" type="date" value={form.fecha_compra} onChange={(e) => set('fecha_compra', e.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-4">
                <Label htmlFor="v-obs">{t('observacoes')}</Label>
                <Input id="v-obs" value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t('cancelar')}</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? tc('loading') : editing ? tc('save') : tc('save')}
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
                <TableHead>{t('matricula')}</TableHead>
                <TableHead>{t('marca')}</TableHead>
                <TableHead>{t('modelo')}</TableHead>
                <TableHead>{t('tipo')}</TableHead>
                <TableHead>{t('ano')}</TableHead>
                <TableHead>{t('km')}</TableHead>
                <TableHead>{t('estado')}</TableHead>
                <TableHead className="text-center">{td('title')}</TableHead>
                <TableHead className="text-right">{tc('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium uppercase">{v.matricula}</TableCell>
                  <TableCell>{v.marca}</TableCell>
                  <TableCell>{v.modelo}</TableCell>
                  <TableCell>{t(`tipos.${v.tipo}`) || v.tipo}</TableCell>
                  <TableCell>{v.ano ?? '—'}</TableCell>
                  <TableCell>{v.km_actuales?.toLocaleString() ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={v.estado === 'activo' ? 'success' : v.estado === 'en_taller' ? 'warning' : 'destructive'}>
                      {t(`estados.${v.estado}`) || v.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <DocumentoAnexo
                        entidade="flota_vehiculos"
                        entidadeId={v.id}
                        referencia={v.matricula}
                        count={documentosCount?.[v.id] || 0}
                        iconOnly
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('edit')}
                        onClick={() => startEdit(v)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={tc('delete')}
                        onClick={() => handleDelete(v.id)}
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
