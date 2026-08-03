'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { departamentoSchema, type DepartamentoFormData } from '@/types/departamento';
import type { DepartamentoRow } from '@/actions/departamentos';
import { criarDepartamento, atualizarDepartamento } from '@/actions/departamentos';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

interface Props {
  initialData?: DepartamentoRow | null;
  isEditing?: boolean;
}

export function DepartamentoForm({ initialData, isEditing = false }: Props) {
  const t = useTranslations('Departamento');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartamentoFormData>({
    resolver: zodResolver(departamentoSchema),
    defaultValues: initialData
      ? {
          nombre: initialData.nombre,
          codigo: initialData.codigo,
          descripcion: initialData.descripcion || '',
          activo: initialData.activo,
        }
      : { activo: true },
  });

  async function onSubmit(data: DepartamentoFormData) {
    setSubmitting(true);
    setSubmitError(null);

    const result = isEditing && initialData
      ? await atualizarDepartamento(initialData.id, data)
      : await criarDepartamento(data);

    if (!result.success) {
      setSubmitError(result.error || 'Erro desconhecido');
      setSubmitting(false);
      return;
    }

    router.push('/departamentos');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? t('edit') : t('new')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">{t('nombre')} *</Label>
            <Input id="nombre" {...register('nombre')} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo">{t('codigo')} *</Label>
            <Input id="codigo" {...register('codigo')} />
            {errors.codigo && <p className="text-xs text-destructive">{errors.codigo.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="descripcion">{t('descripcion')}</Label>
            <Input id="descripcion" {...register('descripcion')} />
          </div>

          {isEditing && (
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="activo"
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-primary"
                {...register('activo')}
              />
              <Label htmlFor="activo">{t('activo')}</Label>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {t('actions.save')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/departamentos')}>
          {t('actions.cancel')}
        </Button>
      </div>
    </form>
  );
}
