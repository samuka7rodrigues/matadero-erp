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
import { horaExtraSchema, type HoraExtraFormData } from '@/types/finanzas';
import type { ColaboradorCompleto } from '@/types/database';
import { createHoraExtra } from '@/actions/finanzas';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

interface Props {
  colaboradores: ColaboradorCompleto[];
}

export function HoraExtraForm({ colaboradores }: Props) {
  const t = useTranslations('Finanzas');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<HoraExtraFormData>({
    resolver: zodResolver(horaExtraSchema),
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      tipo: 'normal',
      estado: 'registrada',
    },
  });

  const valores = watch();
  const importe = (Number(valores.horas) || 0) * (Number(valores.valor_hora) || 0);

  async function onSubmit(data: HoraExtraFormData) {
    setSubmitting(true);
    setSubmitError(null);

    const result = await createHoraExtra(data);
    if (!result.success || !result.id) {
      setSubmitError(result.error || 'Erro desconhecido');
      setSubmitting(false);
      return;
    }
    router.push('/horas-extras');
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
          <CardTitle>{t('horasExtras.new')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="colaborador_id">{t('horasExtras.colaborador')} *</Label>
            <Select id="colaborador_id" {...register('colaborador_id')}>
              <option value="">—</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellido1 || ''}</option>
              ))}
            </Select>
            {errors.colaborador_id && <p className="text-xs text-destructive">{errors.colaborador_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">{t('horasExtras.data')} *</Label>
            <Input id="data" type="date" {...register('data')} />
            {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="horas">{t('horasExtras.horas')} *</Label>
            <Input id="horas" type="number" step="0.5" {...register('horas')} />
            {errors.horas && <p className="text-xs text-destructive">{errors.horas.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_hora">{t('horasExtras.valorHora')} *</Label>
            <Input id="valor_hora" type="number" step="0.01" {...register('valor_hora')} />
            {errors.valor_hora && <p className="text-xs text-destructive">{errors.valor_hora.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">{t('horasExtras.tipo')}</Label>
            <Select id="tipo" {...register('tipo')}>
              <option value="normal">Normal</option>
              <option value="festivo">Feriado</option>
              <option value="nocturna">Nocturna</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">{t('horasExtras.estado')}</Label>
            <Select id="estado" {...register('estado')}>
              <option value="registrada">Registrada</option>
              <option value="pagada">Pagada</option>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observacoes">{t('horasExtras.observacoes')}</Label>
            <Input id="observacoes" {...register('observacoes')} />
          </div>

          <div className="flex items-end justify-end rounded-md bg-muted p-3 md:col-span-2">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('horasExtras.importe')}</p>
              <p className="text-2xl font-bold">{importe.toLocaleString()} €</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/horas-extras')}>
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? tc('loading') : tc('save')}
        </Button>
      </div>
    </form>
  );
}
