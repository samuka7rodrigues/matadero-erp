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
import { despesaSchema, type DespesaFormData } from '@/types/finanzas';
import type { Cliente } from '@/types/database';
import { createDespesa } from '@/actions/finanzas';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

interface Props {
  clientes: Cliente[];
}

export function DespesaForm({ clientes }: Props) {
  const t = useTranslations('Finanzas');
  const tc = useTranslations('Common');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema),
    defaultValues: {
      data: new Date().toISOString().slice(0, 10),
      categoria: 'servicios',
      forma_pago: 'transferencia',
      estado: 'registrado',
      iva: 0,
    },
  });

  async function onSubmit(data: DespesaFormData) {
    setSubmitting(true);
    setSubmitError(null);

    const result = await createDespesa(data);
    if (!result.success || !result.id) {
      setSubmitError(result.error || 'Erro desconhecido');
      setSubmitting(false);
      return;
    }
    router.push('/despesas');
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
          <CardTitle>{t('despesas.new')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="concepto">{t('despesas.concepto')} *</Label>
            <Input id="concepto" {...register('concepto')} />
            {errors.concepto && <p className="text-xs text-destructive">{errors.concepto.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">{t('despesas.data')} *</Label>
            <Input id="data" type="date" {...register('data')} />
            {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="importe">{t('despesas.importe')} *</Label>
            <Input id="importe" type="number" step="0.01" {...register('importe')} />
            {errors.importe && <p className="text-xs text-destructive">{errors.importe.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">{t('despesas.categoria')}</Label>
            <Select id="categoria" {...register('categoria')}>
              <option value="servicios">Serviços</option>
              <option value="compra_materias">Compra de matérias</option>
              <option value="alquileres">Aluguéis</option>
              <option value="personal">Pessoal</option>
              <option value="otros">Outros</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente_id">{t('despesas.cliente')}</Label>
            <Select id="cliente_id" {...register('cliente_id')}>
              <option value="">—</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iva">IVA</Label>
            <Input id="iva" type="number" step="0.01" {...register('iva')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fornecedor">{t('despesas.fornecedor')}</Label>
            <Input id="fornecedor" {...register('fornecedor')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="forma_pago">{t('despesas.formaPago')}</Label>
            <Select id="forma_pago" {...register('forma_pago')}>
              <option value="transferencia">Transferência</option>
              <option value="efectivo">Efetivo</option>
              <option value="tarjeta">Cartão</option>
              <option value="cheque">Cheque</option>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observacoes">{t('despesas.observacoes')}</Label>
            <Input id="observacoes" {...register('observacoes')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/despesas')}>
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? tc('loading') : tc('save')}
        </Button>
      </div>
    </form>
  );
}
