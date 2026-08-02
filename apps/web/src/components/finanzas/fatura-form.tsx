'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { faturaSchema, type FaturaFormData } from '@/types/finanzas';
import type { Cliente, Empresa } from '@/types/database';
import { createFatura } from '@/actions/finanzas';
import { useTranslations } from 'next-intl';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';

interface Props {
  clientes: Cliente[];
  empresas: Empresa[];
}

export function FaturaForm({ clientes, empresas }: Props) {
  const t = useTranslations('Finanzas');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FaturaFormData>({
    resolver: zodResolver(faturaSchema),
    defaultValues: {
      estado: 'borrador',
      fecha_emision: new Date().toISOString().slice(0, 10),
      itens: [{ descricao: '', quantidade: 1, preco_unitario: 0, iva_pct: 21 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' });
  const itens = watch('itens');

  const totais = (itens || []).reduce(
    (acc, item) => {
      const base = (Number(item.quantidade) || 0) * (Number(item.preco_unitario) || 0);
      acc.base += base;
      acc.iva += base * ((Number(item.iva_pct) || 0) / 100);
      return acc;
    },
    { base: 0, iva: 0 }
  );

  async function onSubmit(data: FaturaFormData) {
    setSubmitting(true);
    setSubmitError(null);

    const result = await createFatura(data);
    if (!result.success || !result.id) {
      setSubmitError(result.error || 'Erro desconhecido');
      setSubmitting(false);
      return;
    }
    router.push(`/faturas/${result.id}`);
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
          <CardTitle>{t('faturas.title')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numero">{t('faturas.numero')} *</Label>
            <Input id="numero" {...register('numero')} placeholder="FAT-2026-001" className="font-mono" />
            {errors.numero && <p className="text-xs text-destructive">{errors.numero.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente_id">{t('faturas.cliente')} *</Label>
            <Select id="cliente_id" {...register('cliente_id')}>
              <option value="">—</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </Select>
            {errors.cliente_id && <p className="text-xs text-destructive">{errors.cliente_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa_id">{t('faturas.empresa')}</Label>
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
            <Label htmlFor="fecha_emision">{t('faturas.fechaEmision')} *</Label>
            <Input id="fecha_emision" type="date" {...register('fecha_emision')} />
            {errors.fecha_emision && <p className="text-xs text-destructive">{errors.fecha_emision.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_vencimiento">{t('faturas.fechaVencimiento')}</Label>
            <Input id="fecha_vencimiento" type="date" {...register('fecha_vencimiento')} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observacoes">{t('faturas.observacoes')}</Label>
            <Input id="observacoes" {...register('observacoes')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('faturas.itens')}</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ descricao: '', quantidade: 1, preco_unitario: 0, iva_pct: 21 })}>
            <Plus className="mr-2 h-4 w-4" />
            {t('faturas.addItem')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {errors.itens && <p className="text-xs text-destructive">{errors.itens.message}</p>}
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 items-end gap-2 rounded-md border p-3">
              <div className="col-span-12 space-y-2 md:col-span-5">
                <Label htmlFor={`itens.${index}.descricao`}>{t('faturas.descricao')} *</Label>
                <Input id={`itens.${index}.descricao`} {...register(`itens.${index}.descricao`)} />
                {errors.itens?.[index]?.descricao && (
                  <p className="text-xs text-destructive">{errors.itens[index].descricao?.message}</p>
                )}
              </div>
              <div className="col-span-4 space-y-2 md:col-span-2">
                <Label htmlFor={`itens.${index}.quantidade`}>{t('faturas.quantidade')}</Label>
                <Input id={`itens.${index}.quantidade`} type="number" step="0.01" {...register(`itens.${index}.quantidade`)} />
              </div>
              <div className="col-span-4 space-y-2 md:col-span-2">
                <Label htmlFor={`itens.${index}.preco_unitario`}>{t('faturas.precoUnitario')}</Label>
                <Input id={`itens.${index}.preco_unitario`} type="number" step="0.01" {...register(`itens.${index}.preco_unitario`)} />
              </div>
              <div className="col-span-3 space-y-2 md:col-span-2">
                <Label htmlFor={`itens.${index}.iva_pct`}>{t('faturas.ivaPct')}</Label>
                <Input id={`itens.${index}.iva_pct`} type="number" step="0.01" {...register(`itens.${index}.iva_pct`)} />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex justify-end border-t pt-3 text-sm">
            <div className="w-full max-w-xs space-y-1">
              <div className="flex justify-between">
                <span>{t('faturas.baseImponible')}</span>
                <span className="font-medium">{totais.base.toLocaleString()} €</span>
              </div>
              <div className="flex justify-between">
                <span>{t('faturas.iva')}</span>
                <span className="font-medium">{totais.iva.toLocaleString()} €</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>{t('faturas.total')}</span>
                <span>{(totais.base + totais.iva).toLocaleString()} €</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/faturas')}>
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? tc('loading') : tc('save')}
        </Button>
      </div>
    </form>
  );
}
