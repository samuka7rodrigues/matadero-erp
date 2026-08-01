/**
 * Schemas Zod + tipos TypeScript para o módulo Contratos.
 *
 * Espelham as tabelas da migration 0014:
 * - contratos
 * - contratos_documentos
 * - contratos_firmas
 */
import { z } from 'zod';

const optionalText = (max = 255) =>
  z
    .string()
    .max(max)
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v ?? null));

const optionalDate = z.string().nullish().or(z.literal('')).transform((v) => v || null);

export const contratoSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório').max(50),
  empresa_id: optionalText(50),
  cliente_id: optionalText(50),
  colaborador_id: optionalText(50),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: optionalDate,
  renovaciones: z.coerce.number().int('Renovações deve ser inteiro').min(0).default(0),
  renovacion_automatica: z.boolean().default(false),
  estado: z.string().max(20).default('borrador'),
  observacoes: optionalText(1000),
});

export type ContratoFormData = z.infer<typeof contratoSchema>;

export const contratoFirmaSchema = z.object({
  tipo: z.string().min(1, 'Tipo de signatário é obrigatório'),
  nombre: z.string().min(1, 'Nome é obrigatório').max(150),
  cargo: optionalText(100),
  dni: optionalText(20),
  data_firma: optionalDate,
  estado: z.string().max(20).default('pendente'),
});

export type ContratoFirmaFormData = z.infer<typeof contratoFirmaSchema>;
