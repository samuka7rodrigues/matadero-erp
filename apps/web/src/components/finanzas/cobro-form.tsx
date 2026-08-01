'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/config';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cobroSchema, type CobroFormData } from '@/types/finanzas';
import type { FaturaCompleto } from '@/types/database';
import { createCobro } from '@/actions/finanzas';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

interface Props {
  faturas: FaturaCompleto[];
}

export function CobroForm({ faturas }: Props) {
  const t = useTranslations('Finanzas');
  const tc = useTranslations('Common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CobroFormData>({
    resolver: zodResolver(cobroSchema),
    defaultValues: {
      fatura_id: searchParams.get('fatura') || '',
      data: new Date().toISOString().slice(0, 10),
      metodo_pago: 'transferencia',
      estado: 'registrado',
    },
  });

  async function onSubmit(data: CobroFormData) {
    setSubmitting(true);
    setSubmitError(null);

    const result = await createCobro(data);
    if (!result.success || !result.id) {
      setSubmitError(result.error || 'Erro desconhecido');
      setSubmitting(false);
      return;
    }
    router.push('/cobros');
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
          <CardTitle>{t('cobros.new')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fatura_id">{t('cobros.fatura')} *</Label>
            <Select id="fatura_id" {...register('fatura_id')}>
              <option value="">—</option>
              {faturas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.numero} — {f.clientes?.nombre || ''} ({Number(f.total).toLocaleString()} €)
                </option>
              ))}
            </Select>
            {errors.fatura_id && <p className="text-xs text-destructive">{errors.fatura_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">{t('cobros.data')} *</Label>
            <Input id="data" type="date" {...register('data')} />
            {errors.data && <p className="text-xs text-destructive">{errors.data.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="importe">{t('cobros.importe')} *</Label>
            <Input id="importe" type="number" step="0.01" {...register('importe')} />
            {errors.importe && <p className="text-xs text-destructive">{errors.importe.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo_pago">{t('cobros.metodoPago')}</Label>
            <Select id="metodo_pago" {...register('metodo_pago')}>
              <option value="transferencia">Transferência</option>
              <option value="efectivo">Efetivo</option>
              <option value="tarjeta">Cartão</option>
              <option value="cheque">Cheque</option>
              <option value="otros">Outros</option>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="referencia">{t('cobros.referencia')}</Label>
            <Input id="referencia" {...register('referencia')} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observacoes">{t('cobros.observacoes')}</Label>
            <Input id="observacoes" {...register('observacoes')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/cobros')}>
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? tc('loading') : tc('save')}
        </Button>
      </div>
    </form>
  );
}
