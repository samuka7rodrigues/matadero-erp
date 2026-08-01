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
import { clienteSchema, type ClienteFormData } from '@/types/finanzas';
import type { Cliente } from '@/types/database';
import { createCliente, updateCliente } from '@/actions/finanzas';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

interface Props {
  initialData?: Cliente | null;
  isEditing?: boolean;
}

function mapClienteToForm(c: Cliente): ClienteFormData {
  return {
    nombre: c.nombre,
    cif_nif: c.cif_nif || '',
    email: c.email || '',
    telefono: c.telefono || '',
    direccion: c.direccion || '',
    ciudad: c.ciudad || '',
    codigo_postal: c.codigo_postal || '',
    pais: c.pais || 'ES',
    estado: c.estado || 'ativo',
    observacoes: c.observacoes || '',
  };
}

export function ClienteForm({ initialData, isEditing = false }: Props) {
  const t = useTranslations('Finanzas');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: initialData
      ? mapClienteToForm(initialData)
      : { pais: 'ES', estado: 'ativo' },
  });

  async function onSubmit(data: ClienteFormData) {
    setSubmitting(true);
    setSubmitError(null);

    if (isEditing && initialData) {
      const result = await updateCliente(initialData.id, data);
      if (!result.success) {
        setSubmitError(result.error || 'Erro desconhecido');
        setSubmitting(false);
        return;
      }
    } else {
      const result = await createCliente(data);
      if (!result.success) {
        setSubmitError(result.error || 'Erro desconhecido');
        setSubmitting(false);
        return;
      }
    }

    router.push('/finanzas/clientes');
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
          <CardTitle>{isEditing ? t('clientes.edit') : t('clientes.new')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">{t('clientes.nombre')} *</Label>
            <Input id="nombre" {...register('nombre')} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cif_nif">{t('clientes.cifNif')}</Label>
            <Input id="cif_nif" {...register('cif_nif')} className="font-mono uppercase" />
            {errors.cif_nif && <p className="text-xs text-destructive">{errors.cif_nif.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('clientes.email')}</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">{t('clientes.telefono')}</Label>
            <Input id="telefono" {...register('telefono')} placeholder="+34 900 000 000" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="direccion">{t('clientes.direccion')}</Label>
            <Input id="direccion" {...register('direccion')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ciudad">{t('clientes.ciudad')}</Label>
            <Input id="ciudad" {...register('ciudad')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo_postal">{t('clientes.codigoPostal')}</Label>
            <Input id="codigo_postal" {...register('codigo_postal')} maxLength={5} />
            {errors.codigo_postal && <p className="text-xs text-destructive">{errors.codigo_postal.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pais">{t('clientes.pais')}</Label>
            <Input id="pais" {...register('pais')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">{t('clientes.estado')}</Label>
            <Select id="estado" {...register('estado')}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observacoes">{t('clientes.observacoes')}</Label>
            <Input id="observacoes" {...register('observacoes')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/finanzas/clientes')}>
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? tc('loading') : tc('save')}
        </Button>
      </div>
    </form>
  );
}
