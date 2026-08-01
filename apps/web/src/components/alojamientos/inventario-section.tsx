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
import { Boxes, Plus, Trash2, AlertCircle } from 'lucide-react';
import { createInventario, deleteInventario } from '@/actions/alojamiento-fase2';
import type { InventarioCompleto, Habitacion } from '@/types/database';

const ESTADO_VARIANT: Record<string, 'default' | 'success' | 'secondary' | 'warning' | 'destructive'> = {
  novo: 'success',
  bom: 'default',
  desgastado: 'warning',
  danificado: 'destructive',
};

export function InventarioSection({
  alojamientoId,
  inventario,
  habitaciones,
}: {
  alojamientoId: string;
  inventario: InventarioCompleto[];
  habitaciones: Habitacion[];
}) {
  const t = useTranslations('Alojamiento.inventario');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('mobiliario');
  const [quantidade, setQuantidade] = useState(1);
  const [estado, setEstado] = useState('bom');
  const [valor, setValor] = useState('');
  const [habitacionId, setHabitacionId] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nombre.trim()) {
      setError(t('messages.requiredNombre'));
      return;
    }
    setSaving(true);
    const result = await createInventario({
      alojamiento_id: alojamientoId,
      habitacion_id: habitacionId || null,
      nombre: nombre.trim(),
      categoria: categoria as 'mobiliario' | 'electrodomestico' | 'ropa_cama' | 'otra',
      quantidade,
      estado: estado as 'novo' | 'bom' | 'desgastado' | 'danificado',
      valor: valor === '' ? 0 : Number(valor),
      observacoes: null,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Erro');
      return;
    }
    setNombre('');
    setValor('');
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    const result = await deleteInventario(id, alojamientoId);
    if (!result.success) {
      setError(result.error || 'Erro ao eliminar');
      return;
    }
    router.refresh();
  }

  const total = inventario.reduce((acc, i) => acc + (i.valor ?? 0) * i.quantidade, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Boxes className="h-4 w-4" />
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
            <Label htmlFor="inv-nombre">{t('nombre')} *</Label>
            <Input id="inv-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-categoria">{t('categoria')}</Label>
            <Select id="inv-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="mobiliario">{t('categorias.mobiliario')}</option>
              <option value="electrodomestico">{t('categorias.electrodomestico')}</option>
              <option value="ropa_cama">{t('categorias.ropa_cama')}</option>
              <option value="otra">{t('categorias.otra')}</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-qtd">{t('quantidade')}</Label>
            <Input id="inv-qtd" type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-estado">{t('estado')}</Label>
            <Select id="inv-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="novo">{t('estados.novo')}</option>
              <option value="bom">{t('estados.bom')}</option>
              <option value="desgastado">{t('estados.desgastado')}</option>
              <option value="danificado">{t('estados.danificado')}</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-valor">{t('valor')}</Label>
            <Input id="inv-valor" type="number" step="0.01" min={0} value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-hab">{t('habitacion')}</Label>
            <Select id="inv-hab" value={habitacionId} onChange={(e) => setHabitacionId(e.target.value)}>
              <option value="">—</option>
              {habitaciones.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.numero}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2 lg:col-span-6">
            <Button type="submit" disabled={saving}>
              <Plus className="mr-2 h-4 w-4" />
              {saving ? '...' : t('new')}
            </Button>
          </div>
        </form>

        {inventario.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('noData')}</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('nombre')}</TableHead>
                  <TableHead>{t('categoria')}</TableHead>
                  <TableHead>{t('quantidade')}</TableHead>
                  <TableHead>{t('estado')}</TableHead>
                  <TableHead>{t('valor')}</TableHead>
                  <TableHead>{t('habitacion')}</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventario.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.nombre}</TableCell>
                    <TableCell className="capitalize">{t(`categorias.${i.categoria}`)}</TableCell>
                    <TableCell>{i.quantidade}</TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_VARIANT[i.estado] || 'secondary'}>
                        {t(`estados.${i.estado}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{i.valor != null ? `${i.valor.toLocaleString()} €` : '—'}</TableCell>
                    <TableCell>{i.habitaciones?.numero || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('actions.delete')}
                        onClick={() => handleDelete(i.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end border-t pt-3 text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="ml-2 font-bold">{total.toLocaleString()} €</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
