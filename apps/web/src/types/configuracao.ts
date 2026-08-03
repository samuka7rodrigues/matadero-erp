import { z } from 'zod';

export const configuracaoSchema = z.object({
  nome_empresa: z.string().trim().min(1, 'Nome da empresa é obrigatório'),
  cif_nif: z.string().trim(),
  moeda: z.string().trim().min(1, 'Moeda é obrigatória'),
  idioma_default: z.enum(['pt-BR', 'es']),
  smi_mensal: z.coerce.number().min(0),
  iva_default: z.coerce.number().min(0).max(100),
  jornada_default: z.string().min(1),
  base_hora_extra: z.coerce.number().min(0),
  dias_ferias_ano: z.coerce.number().int().min(0),
  fatura_serie: z.string().trim().min(1, 'Série de fatura é obrigatória'),
  fatura_vencimento_dias: z.coerce.number().int().min(0),
  cobro_vencimento_dias: z.coerce.number().int().min(0),
  pago_vencimento_dias: z.coerce.number().int().min(0),
  alerta_itv: z.boolean(),
  alerta_itv_dias: z.coerce.number().int().min(0),
  alerta_seguro: z.boolean(),
  alerta_seguro_dias: z.coerce.number().int().min(0),
  alerta_contrato: z.boolean(),
  alerta_contrato_dias: z.coerce.number().int().min(0),
  alerta_alojamiento: z.boolean(),
  alerta_alojamiento_dias: z.coerce.number().int().min(0),
});

export type ConfiguracaoFormData = z.infer<typeof configuracaoSchema>;

export const feriadoSchema = z.object({
  fecha: z.string().min(1, 'Data é obrigatória'),
  nombre: z.string().trim().min(1, 'Nome é obrigatório'),
});

export type FeriadoFormData = z.infer<typeof feriadoSchema>;
