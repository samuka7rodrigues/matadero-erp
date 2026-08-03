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
import { configuracaoSchema, type ConfiguracaoFormData } from '@/types/configuracao';
import type { ConfiguracaoRow } from '@/actions/configuracao';
import { atualizarConfiguracao } from '@/actions/configuracao';
import { useTranslations } from 'next-intl';
import { AlertCircle, Building2, Users, Receipt, Bell } from 'lucide-react';

interface Props {
  config: ConfiguracaoRow | null;
}

function defaultValues(config: ConfiguracaoRow | null): ConfiguracaoFormData {
  if (!config) {
    return {
      nome_empresa: '',
      cif_nif: '',
      moeda: 'EUR',
      idioma_default: 'pt-BR',
      smi_mensal: 1134,
      iva_default: 21,
      jornada_default: 'completa',
      base_hora_extra: 10,
      dias_ferias_ano: 30,
      fatura_serie: 'FAT',
      fatura_vencimento_dias: 30,
      cobro_vencimento_dias: 30,
      pago_vencimento_dias: 30,
      alerta_itv: true,
      alerta_itv_dias: 30,
      alerta_seguro: true,
      alerta_seguro_dias: 30,
      alerta_contrato: true,
      alerta_contrato_dias: 60,
      alerta_alojamiento: true,
      alerta_alojamiento_dias: 30,
    };
  }
  return {
    nome_empresa: config.nome_empresa,
    cif_nif: config.cif_nif || '',
    moeda: config.moeda,
    idioma_default: config.idioma_default as 'pt-BR' | 'es',
    smi_mensal: config.smi_mensal,
    iva_default: config.iva_default,
    jornada_default: config.jornada_default,
    base_hora_extra: config.base_hora_extra,
    dias_ferias_ano: config.dias_ferias_ano,
    fatura_serie: config.fatura_serie,
    fatura_vencimento_dias: config.fatura_vencimento_dias,
    cobro_vencimento_dias: config.cobro_vencimento_dias,
    pago_vencimento_dias: config.pago_vencimento_dias,
    alerta_itv: config.alerta_itv,
    alerta_itv_dias: config.alerta_itv_dias,
    alerta_seguro: config.alerta_seguro,
    alerta_seguro_dias: config.alerta_seguro_dias,
    alerta_contrato: config.alerta_contrato,
    alerta_contrato_dias: config.alerta_contrato_dias,
    alerta_alojamiento: config.alerta_alojamiento,
    alerta_alojamiento_dias: config.alerta_alojamiento_dias,
  };
}

export function ConfiguracaoForm({ config }: Props) {
  const t = useTranslations('Configuracao');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfiguracaoFormData>({
    resolver: zodResolver(configuracaoSchema),
    defaultValues: defaultValues(config),
  });

  async function onSubmit(data: ConfiguracaoFormData) {
    setSubmitting(true);
    setSubmitError(null);
    setSaved(false);

    const result = await atualizarConfiguracao(data);
    if (!result.success) {
      setSubmitError(result.error || 'Erro desconhecido');
      setSubmitting(false);
      return;
    }

    setSaved(true);
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}
      {saved && (
        <div className="rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-700">
          {t('saved')}
        </div>
      )}

      {/* Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            {t('sections.empresa')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome_empresa">{t('fields.nomeEmpresa')} *</Label>
            <Input id="nome_empresa" {...register('nome_empresa')} />
            {errors.nome_empresa && (
              <p className="text-xs text-destructive">{errors.nome_empresa.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cif_nif">{t('fields.cifNif')}</Label>
            <Input id="cif_nif" {...register('cif_nif')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="moeda">{t('fields.moeda')} *</Label>
            <Input id="moeda" {...register('moeda')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idioma_default">{t('fields.idiomaDefault')}</Label>
            <Select id="idioma_default" {...register('idioma_default')}>
              <option value="pt-BR">Português (BR)</option>
              <option value="es">Español</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* RH */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {t('sections.rh')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="smi_mensal">{t('fields.smiMensal')}</Label>
            <Input id="smi_mensal" type="number" step="0.01" {...register('smi_mensal')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jornada_default">{t('fields.jornadaDefault')}</Label>
            <Select id="jornada_default" {...register('jornada_default')}>
              <option value="completa">Completa</option>
              <option value="parcial">Parcial</option>
              <option value="reduzida">Reduzida</option>
              <option value="intensiva">Intensiva</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="base_hora_extra">{t('fields.baseHoraExtra')}</Label>
            <Input id="base_hora_extra" type="number" step="0.01" {...register('base_hora_extra')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dias_ferias_ano">{t('fields.diasFeriasAno')}</Label>
            <Input id="dias_ferias_ano" type="number" {...register('dias_ferias_ano')} />
          </div>
        </CardContent>
      </Card>

      {/* Finanças */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            {t('sections.finanzas')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="iva_default">{t('fields.ivaDefault')}</Label>
            <Input id="iva_default" type="number" step="0.01" {...register('iva_default')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatura_serie">{t('fields.faturaSerie')}</Label>
            <Input id="fatura_serie" {...register('fatura_serie')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatura_vencimento_dias">{t('fields.faturaVencimentoDias')}</Label>
            <Input id="fatura_vencimento_dias" type="number" {...register('fatura_vencimento_dias')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cobro_vencimento_dias">{t('fields.cobroVencimentoDias')}</Label>
            <Input id="cobro_vencimento_dias" type="number" {...register('cobro_vencimento_dias')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pago_vencimento_dias">{t('fields.pagoVencimentoDias')}</Label>
            <Input id="pago_vencimento_dias" type="number" {...register('pago_vencimento_dias')} />
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            {t('sections.alertas')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { ativoKey: 'alerta_itv' as const, diasKey: 'alerta_itv_dias' as const, labelKey: 'fields.alertaItv' as const },
            { ativoKey: 'alerta_seguro' as const, diasKey: 'alerta_seguro_dias' as const, labelKey: 'fields.alertaSeguro' as const },
            { ativoKey: 'alerta_contrato' as const, diasKey: 'alerta_contrato_dias' as const, labelKey: 'fields.alertaContrato' as const },
            { ativoKey: 'alerta_alojamiento' as const, diasKey: 'alerta_alojamiento_dias' as const, labelKey: 'fields.alertaAlojamiento' as const },
          ].map(({ ativoKey, diasKey, labelKey }) => (
            <div key={ativoKey} className="flex flex-wrap items-center gap-3 rounded-md border p-3">
              <input
                id={ativoKey}
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-primary"
                {...register(ativoKey)}
              />
              <Label htmlFor={ativoKey} className="flex-1">
                {t(labelKey)}
              </Label>
              <div className="flex items-center gap-2">
                <Label htmlFor={diasKey} className="text-sm text-muted-foreground">
                  {t('fields.alertaDias')}
                </Label>
                <Input
                  id={diasKey}
                  type="number"
                  className="w-24"
                  {...register(diasKey)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
