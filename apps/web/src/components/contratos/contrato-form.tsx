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
import { contratoSchema, type ContratoFormData } from '@/types/contratos';
import type { ContratoGeral, Colaborador, Empresa, Cliente } from '@/types/database';
import { createContrato, updateContrato } from '@/actions/contratos';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

interface Props {
  empresas: Empresa[];
  clientes: Cliente[];
  colaboradores: Colaborador[];
  initialData?: ContratoGeral | null;
  isEditing?: boolean;
}

function nombreColaborador(c: Colaborador): string {
  return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(' ');
}

function mapContratoToForm(c: ContratoGeral): ContratoFormData {
  return {
    numero: c.numero,
    empresa_id: c.empresa_id || '',
    cliente_id: c.cliente_id || '',
    colaborador_id: c.colaborador_id || '',
    data_inicio: c.data_inicio,
    data_fim: c.data_fim || '',
    renovaciones: c.renovaciones ?? 0,
    renovacion_automatica: c.renovacion_automatica ?? false,
    estado: c.estado,
    observacoes: c.observacoes || '',
  };
}

export function ContratoForm({
  empresas,
  clientes,
  colaboradores,
  initialData,
  isEditing = false,
}: Props) {
  const t = useTranslations('Contratos');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: initialData
      ? mapContratoToForm(initialData)
      : { renovaciones: 0, renovacion_automatica: false, estado: 'borrador' },
  });

  async function onSubmit(data: ContratoFormData) {
    setSubmitting(true);
    setSubmitError(null);

    let result;
    if (isEditing && initialData) {
      result = await updateContrato(initialData.id, data);
    } else {
      result = await createContrato(data);
    }

    if (!result.success) {
      setSubmitError(result.error || 'Erro desconhecido');
      setSubmitting(false);
      return;
    }

    router.push('/contratos');
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
            <Label htmlFor="numero">{t('numero')} *</Label>
            <Input id="numero" {...register('numero')} placeholder="CT-2026-001" className="font-mono" />
            {errors.numero && <p className="text-xs text-destructive">{errors.numero.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">{t('estado')}</Label>
            <Select id="estado" {...register('estado')}>
              {Object.keys(t.raw('estados')).map((key) => (
                <option key={key} value={key}>
                  {t(`estados.${key}`)}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa_id">{t('empresa')}</Label>
            <Select id="empresa_id" {...register('empresa_id')}>
              <option value="">—</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre_comercial || e.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente_id">{t('cliente')}</Label>
            <Select id="cliente_id" {...register('cliente_id')}>
              <option value="">—</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="colaborador_id">{t('colaborador')}</Label>
            <Select id="colaborador_id" {...register('colaborador_id')}>
              <option value="">—</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>{nombreColaborador(c)}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_inicio">{t('dataInicio')} *</Label>
            <Input id="data_inicio" type="date" {...register('data_inicio')} />
            {errors.data_inicio && <p className="text-xs text-destructive">{errors.data_inicio.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_fim">{t('dataFim')}</Label>
            <Input id="data_fim" type="date" {...register('data_fim')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renovaciones">{t('renovaciones')}</Label>
            <Input id="renovaciones" type="number" min={0} {...register('renovaciones')} />
          </div>

          <div className="flex items-end space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4 rounded border-input" {...register('renovacion_automatica')} />
              {t('renovacionAutomatica')}
            </label>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observacoes">{t('observacoes')}</Label>
            <Input id="observacoes" {...register('observacoes')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/contratos')}>
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? tc('loading') : tc('save')}
        </Button>
      </div>
    </form>
  );
}
