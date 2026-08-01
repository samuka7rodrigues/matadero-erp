/**
 * Schema Zod + tipos TypeScript para o formulário de alojamento (vivienda).
 *
 * Espelha a tabela `alojamientos` da migration 0009_alojamientos.sql
 * (apenas os campos editáveis pelo utilizador).
 */
import { z } from 'zod';

const optionalText = (max = 255) =>
  z
    .string()
    .max(max)
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v ?? null));

export const alojamientoSchema = z.object({
  empresa_id: z
    .string()
    .uuid()
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v ?? null)),

  // Identificação
  codigo: optionalText(30),
  nombre: z.string().min(1, 'Nome é obrigatório').max(150),
  tipo: z.string().max(50).default('vivienda'),
  capacidad: z.coerce.number().int('Nº inteiro').min(1, 'Capacidade mínima 1').max(1000),

  // Morada
  direccion: optionalText(200),
  ciudad: optionalText(100),
  codigo_postal: optionalText(10).refine(
    (v) => !v || /^[0-9]{4,5}$/.test(v),
    { message: 'Código postal inválido' }
  ),
  pais: z.string().max(50).default('ES'),

  // Económico
  renda_mensal: z.coerce.number().min(0, 'Renda não pode ser negativa').max(1000000),

  // Gestão
  responsable: optionalText(150),
  estado: z.enum(['ativo', 'inativo']).default('ativo'),
  observacoes: optionalText(500),
});

export type AlojamientoFormData = z.infer<typeof alojamientoSchema>;

export const habitacionSchema = z.object({
  alojamiento_id: z.string().uuid('Alojamento inválido'),
  numero: z.string().min(1, 'Número é obrigatório').max(20),
  nombre: optionalText(150),
  tipo: z.enum(['individual', 'compartida', 'matrimonial']).default('compartida'),
  capacidad: z.coerce.number().int('Nº inteiro').min(1, 'Capacidade mínima 1').max(50),
  estado: z.enum(['livre', 'ocupada', 'manutencao', 'fora_de_uso']).default('livre'),
  observacoes: optionalText(500),
});

export type HabitacionFormData = z.infer<typeof habitacionSchema>;

export const ocupacionSchema = z
  .object({
    alojamiento_id: z.string().uuid('Alojamento inválido'),
    habitacion_id: z.string().uuid('Habitación inválida').nullish().or(z.literal('')).transform((v) => (v === '' ? null : v ?? null)),
    colaborador_id: z.string().uuid('Colaborador inválido'),
    data_entrada: z.coerce.date({ invalid_type_error: 'Data de entrada inválida' }),
    data_saida: z.coerce.date({ invalid_type_error: 'Data de saída inválida' }).nullish().or(z.literal('')).transform((v) => (v === '' ? null : v ?? null)),
    estado: z.enum(['ativa', 'concluida']).default('ativa'),
    observacoes: optionalText(500),
  })
  .superRefine((data, ctx) => {
    if (data.data_saida && data.data_saida < data.data_entrada) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['data_saida'],
        message: 'Data de saída não pode ser anterior à de entrada',
      });
    }
  });

export type OcupacionFormData = z.infer<typeof ocupacionSchema>;

/* ============================================================
 * Fase 2 — inventário, incidencias, contratos, consumos
 * ============================================================ */

export const inventarioSchema = z.object({
  alojamiento_id: z.string().uuid('Alojamento inválido'),
  habitacion_id: z.string().uuid('Habitación inválida').nullish().or(z.literal('')).transform((v) => (v === '' ? null : v ?? null)),
  nombre: z.string().min(1, 'Nome é obrigatório').max(150),
  categoria: z.enum(['mobiliario', 'electrodomestico', 'ropa_cama', 'otra']).default('mobiliario'),
  quantidade: z.coerce.number().int('Nº inteiro').min(1, 'Quantidade mínima 1').max(10000),
  estado: z.enum(['novo', 'bom', 'desgastado', 'danificado']).default('bom'),
  valor: z.coerce.number().min(0, 'Valor não pode ser negativo').max(1000000),
  observacoes: optionalText(500),
});

export type InventarioFormData = z.infer<typeof inventarioSchema>;

export const incidenciaSchema = z.object({
  alojamiento_id: z.string().uuid('Alojamento inválido'),
  habitacion_id: z.string().uuid('Habitación inválida').nullish().or(z.literal('')).transform((v) => (v === '' ? null : v ?? null)),
  tipo: z.enum(['mantenimiento', 'limpieza', 'otra']).default('mantenimiento'),
  descripcion: z.string().min(1, 'Descrição é obrigatória').max(500),
  prioridad: z.enum(['baja', 'media', 'alta']).default('media'),
  estado: z.enum(['abierta', 'en_proceso', 'resuelta']).default('abierta'),
  observacoes: optionalText(500),
});

export type IncidenciaFormData = z.infer<typeof incidenciaSchema>;

export const contratoSchema = z
  .object({
    codigo: optionalText(30),
    alojamiento_id: z.string().uuid('Alojamento inválido'),
    habitacion_id: z.string().uuid('Habitación inválida').nullish().or(z.literal('')).transform((v) => (v === '' ? null : v ?? null)),
    colaborador_id: z.string().uuid('Colaborador inválido'),
    data_inicio: z.coerce.date({ invalid_type_error: 'Data de início inválida' }),
    data_fim: z.coerce.date({ invalid_type_error: 'Data de fim inválida' }).nullish().or(z.literal('')).transform((v) => (v === '' ? null : v ?? null)),
    renda: z.coerce.number().min(0, 'Renda não pode ser negativa').max(1000000),
    estado: z.enum(['ativo', 'vencido', 'rescindido']).default('ativo'),
    observacoes: optionalText(500),
  })
  .superRefine((data, ctx) => {
    if (data.data_fim && data.data_fim < data.data_inicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['data_fim'],
        message: 'Data de fim não pode ser anterior à de início',
      });
    }
  });

export type ContratoFormData = z.infer<typeof contratoSchema>;

export const consumoSchema = z.object({
  alojamiento_id: z.string().uuid('Alojamento inválido'),
  tipo: z.enum(['agua', 'luz', 'gas', 'otros']).default('agua'),
  data: z.coerce.date({ invalid_type_error: 'Data inválida' }),
  leitura_anterior: z.coerce.number().min(0, 'Leitura não pode ser negativa').max(999999999999),
  leitura_atual: z.coerce.number().min(0, 'Leitura não pode ser negativa').max(999999999999),
  importe: z.coerce.number().min(0, 'Importe não pode ser negativo').max(1000000),
  fornecedor: optionalText(150),
  observacoes: optionalText(500),
}).superRefine((data, ctx) => {
  if (data.leitura_atual < data.leitura_anterior) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['leitura_atual'],
      message: 'Leitura atual não pode ser menor que a anterior',
    });
  }
});

export type ConsumoFormData = z.infer<typeof consumoSchema>;
