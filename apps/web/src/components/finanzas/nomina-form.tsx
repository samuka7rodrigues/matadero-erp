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
import { nominaSchema, type NominaFormData } from '@/types/finanzas';
import type { ColaboradorCompleto } from '@/types/database';
import { createNomina } from '@/actions/finanzas';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

interface Props {
  colaboradores: ColaboradorCompleto[];
}

export function NominaForm({ colaboradores }: Props) {
  const t = useTranslations('Finanzas');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hoje = new Date();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NominaFormData>({
    resolver: zodResolver(nominaSchema),
    defaultValues: {
      mes: hoje.getMonth() + 1,
      ano: hoje.getFullYear(),
      estado: 'calculada',
      salario_base: 0,
      horas_extra_importe: 0,
      complementos: 0,
      irpf: 0,
      seguranca_social: 0,
      outras_deducoes: 0,
      liquido: 0,
    },
  });

  const valores = watch();
  const liquido = Math.max(
    0,
    Number(valores.salario_base || 0) +
      Number(valores.horas_extra_importe || 0) +
      Number(valores.complementos || 0) -
      Number(valores.irpf || 0) -
      Number(valores.seguranca_social || 0) -
      Number(valores.outras_deducoes || 0)
  );

  async function onSubmit(data: NominaFormData) {
    setSubmitting(true);
    setSubmitError(null);

    const result = await createNomina(data);
    if (!result.success || !result.id) {
      setSubmitError(result.error || 'Erro desconhecido');
      setSubmitting(false);
      return;
    }
    router.push('/rh/nominas');
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
          <CardTitle>{t('nominas.new')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="colaborador_id">{t('nominas.colaborador')} *</Label>
            <Select id="colaborador_id" {...register('colaborador_id')}>
              <option value="">—</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellido1 || ''}</option>
              ))}
            </Select>
            {errors.colaborador_id && <p className="text-xs text-destructive">{errors.colaborador_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mes">{t('nominas.mes')} *</Label>
              <Select id="mes" {...register('mes', { valueAsNumber: true })}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ano">{t('nominas.ano')} *</Label>
              <Input id="ano" type="number" {...register('ano', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salario_base">{t('nominas.salarioBase')} *</Label>
            <Input id="salario_base" type="number" step="0.01" {...register('salario_base', { valueAsNumber: true })} />
            {errors.salario_base && <p className="text-xs text-destructive">{errors.salario_base.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="horas_extra_importe">{t('nominas.horasExtra')}</Label>
            <Input id="horas_extra_importe" type="number" step="0.01" {...register('horas_extra_importe', { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="complementos">{t('nominas.complementos')}</Label>
            <Input id="complementos" type="number" step="0.01" {...register('complementos', { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="irpf">{t('nominas.irpf')}</Label>
            <Input id="irpf" type="number" step="0.01" {...register('irpf', { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seguranca_social">{t('nominas.segurancaSocial')}</Label>
            <Input id="seguranca_social" type="number" step="0.01" {...register('seguranca_social', { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outras_deducoes">{t('nominas.outrasDeducoes')}</Label>
            <Input id="outras_deducoes" type="number" step="0.01" {...register('outras_deducoes', { valueAsNumber: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">{t('nominas.estado')}</Label>
            <Select id="estado" {...register('estado')}>
              <option value="calculada">Calculada</option>
              <option value="pagada">Pagada</option>
              <option value="anulada">Anulada</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_pago">{t('nominas.fechaPago')}</Label>
            <Input id="fecha_pago" type="date" {...register('fecha_pago')} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observacoes">{t('nominas.observacoes')}</Label>
            <Input id="observacoes" {...register('observacoes')} />
          </div>

          <div className="flex items-end justify-end rounded-md bg-muted p-3 md:col-span-3">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('nominas.liquido')}</p>
              <p className="text-2xl font-bold">{liquido.toLocaleString()} €</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/rh/nominas')}>
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? tc('loading') : tc('save')}
        </Button>
      </div>
    </form>
  );
}
