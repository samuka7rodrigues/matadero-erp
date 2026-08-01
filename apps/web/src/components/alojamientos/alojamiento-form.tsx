'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { alojamientoSchema, type AlojamientoFormData } from '@/types/alojamiento';
import type { Alojamiento, Empresa } from '@/types/database';
import { createAlojamiento, updateAlojamiento } from '@/actions/alojamiento';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

interface Props {
  initialData?: Alojamiento | null;
  isEditing?: boolean;
  empresas: Empresa[];
}

function mapAlojamientoToForm(a: Alojamiento): AlojamientoFormData {
  return {
    empresa_id: a.empresa_id || '',
    codigo: a.codigo || '',
    nombre: a.nombre,
    tipo: a.tipo || 'vivienda',
    capacidad: a.capacidad ?? 1,
    direccion: a.direccion || '',
    ciudad: a.ciudad || '',
    codigo_postal: a.codigo_postal || '',
    pais: a.pais || 'ES',
    renda_mensal: a.renda_mensal ?? 0,
    responsable: a.responsable || '',
    estado: a.estado === 'inativo' ? 'inativo' : 'ativo',
    observacoes: a.observacoes || '',
  };
}

const TIPOS = ['vivienda', 'habitacion', 'piso', 'apartamento', 'residencia'];

export function AlojamientoForm({ initialData, isEditing = false, empresas }: Props) {
  const t = useTranslations('Alojamiento');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AlojamientoFormData>({
    resolver: zodResolver(alojamientoSchema),
    defaultValues: initialData
      ? mapAlojamientoToForm(initialData)
      : { tipo: 'vivienda', pais: 'ES', estado: 'ativo', capacidad: 1, renda_mensal: 0 },
  });

  async function onSubmit(data: AlojamientoFormData) {
    setSubmitting(true);
    setSubmitError(null);

    if (isEditing && initialData) {
      const result = await updateAlojamiento(initialData.id, data);
      if (!result.success) {
        setSubmitError(result.error || 'Erro desconhecido');
        setSubmitting(false);
        return;
      }
      router.push(`/alojamientos/${initialData.id}`);
      return;
    }

    const result = await createAlojamiento(data);
    if (!result.success || !result.id) {
      setSubmitError(result.error || 'Erro desconhecido');
      setSubmitting(false);
      return;
    }
    router.push(`/alojamientos/${result.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      {/* Identificação */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.identificacion')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="empresa_id">{t('fields.empresa')}</Label>
            <Select id="empresa_id" {...register('empresa_id')}>
              <option value="">—</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo">{t('fields.codigo')}</Label>
            <Input id="codigo" {...register('codigo')} placeholder="VIV-001" className="font-mono uppercase" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">{t('fields.nombre')} *</Label>
            <Input id="nombre" {...register('nombre')} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">{t('fields.tipo')}</Label>
            <Select id="tipo" {...register('tipo')}>
              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacidad">{t('fields.capacidad')}</Label>
            <Input id="capacidad" type="number" min={1} {...register('capacidad', { valueAsNumber: true })} />
            {errors.capacidad && <p className="text-xs text-destructive">{errors.capacidad.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Morada */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.morada')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="direccion">{t('fields.direccion')}</Label>
            <Input id="direccion" {...register('direccion')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ciudad">{t('fields.ciudad')}</Label>
            <Input id="ciudad" {...register('ciudad')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo_postal">{t('fields.codigoPostal')}</Label>
            <Input id="codigo_postal" {...register('codigo_postal')} maxLength={5} />
            {errors.codigo_postal && <p className="text-xs text-destructive">{errors.codigo_postal.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pais">{t('fields.pais')}</Label>
            <Input id="pais" {...register('pais')} />
          </div>
        </CardContent>
      </Card>

      {/* Gestão */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.gestao')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="renda_mensal">{t('fields.rendaMensal')}</Label>
            <Input
              id="renda_mensal"
              type="number"
              step="0.01"
              min={0}
              {...register('renda_mensal', { valueAsNumber: true })}
            />
            {errors.renda_mensal && <p className="text-xs text-destructive">{errors.renda_mensal.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsable">{t('fields.responsable')}</Label>
            <Input id="responsable" {...register('responsable')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">{t('fields.estado')}</Label>
            <Select id="estado" {...register('estado')}>
              <option value="ativo">{t('estados.ativo')}</option>
              <option value="inativo">{t('estados.inativo')}</option>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observacoes">{t('fields.observacoes')}</Label>
            <textarea
              id="observacoes"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('observacoes')}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/alojamientos')}
        >
          {t('actions.cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'A guardar...' : t('actions.save')}
        </Button>
      </div>
    </form>
  );
}
