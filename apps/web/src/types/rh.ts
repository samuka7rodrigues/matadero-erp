/**
 * Schemas Zod + tipos TypeScript para o módulo RH ampliado.
 *
 * Espelham as tabelas da migration 0015:
 * - ausencias, cursos, certificados, advertencias, avaliacoes
 * - ferias (migration 0002)
 * - exames_medicos, entregas_epi (migration 0001)
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

const optionalUuid = z
  .string()
  .uuid('ID inválido')
  .nullish()
  .or(z.literal(''))
  .transform((v) => v || null);

/* ============================================================
 * Ausencias
 * ============================================================ */

export const ausenciaSchema = z.object({
  colaborador_id: z.string().uuid('Colaborador é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório').default('ausencia'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: optionalDate,
  motivo: optionalText(1000),
  justificada: z.boolean().default(false),
  estado: z.string().min(1).default('pendiente'),
  observacoes: optionalText(1000),
});

export type AusenciaFormData = z.infer<typeof ausenciaSchema>;

/* ============================================================
 * Cursos
 * ============================================================ */

export const cursoSchema = z.object({
  colaborador_id: z.string().uuid('Colaborador é obrigatório'),
  nombre: z.string().min(1, 'Nome do curso é obrigatório').max(255),
  entidad: optionalText(255),
  horas: z.coerce.number().min(0).nullish().transform((v) => (v == null ? null : v)),
  data_inicio: optionalDate,
  data_fim: optionalDate,
  estado: z.string().min(1).default('programado'),
  observacoes: optionalText(1000),
});

export type CursoFormData = z.infer<typeof cursoSchema>;

/* ============================================================
 * Certificados
 * ============================================================ */

export const certificadoSchema = z.object({
  colaborador_id: z.string().uuid('Colaborador é obrigatório'),
  curso_id: optionalUuid,
  nombre: z.string().min(1, 'Nome do certificado é obrigatório').max(255),
  entidad: optionalText(255),
  tipo: z.string().min(1).default('otro'),
  numero: optionalText(50),
  data_emision: z.string().min(1, 'Data de emissão é obrigatória'),
  data_validez: optionalDate,
  observacoes: optionalText(1000),
});

export type CertificadoFormData = z.infer<typeof certificadoSchema>;

/* ============================================================
 * Advertencias
 * ============================================================ */

export const advertenciaSchema = z.object({
  colaborador_id: z.string().uuid('Colaborador é obrigatório'),
  tipo: z.string().min(1).default('escrita'),
  gravidade: z.string().min(1).default('leve'),
  motivo: z.string().min(1, 'Motivo é obrigatório').max(1000),
  data_advertencia: z.string().min(1, 'Data é obrigatória'),
  estado: z.string().min(1).default('abierta'),
  observacoes: optionalText(1000),
});

export type AdvertenciaFormData = z.infer<typeof advertenciaSchema>;

/* ============================================================
 * Avaliacoes
 * ============================================================ */

export const avaliacaoSchema = z.object({
  colaborador_id: z.string().uuid('Colaborador é obrigatório'),
  tipo: z.string().min(1).default('anual'),
  periodo: optionalText(50),
  data_avaliacao: z.string().min(1, 'Data é obrigatória'),
  pontuacao: z.coerce.number().min(0, 'Pontuação mínima 0').max(10, 'Pontuação máxima 10').nullish(),
  resultados: optionalText(2000),
  objetivos: optionalText(2000),
  avaliador_id: optionalUuid,
  observacoes: optionalText(2000),
});

export type AvaliacaoFormData = z.infer<typeof avaliacaoSchema>;

/* ============================================================
 * Ferias (migration 0002)
 * ============================================================ */

export const feriasSchema = z.object({
  colaborador_id: z.string().uuid('Colaborador é obrigatório'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().min(1, 'Data de fim é obrigatória'),
  tipo: z.string().min(1).default('vacaciones'),
  estado: z.string().min(1).default('pendente'),
  observacoes: optionalText(1000),
});

export type FeriasFormData = z.infer<typeof feriasSchema>;

/* ============================================================
 * Exames médicos (migration 0001)
 * ============================================================ */

export const exameMedicoSchema = z.object({
  colaborador_id: z.string().uuid('Colaborador é obrigatório'),
  fecha_examen: z.string().min(1, 'Data do exame é obrigatória'),
  fecha_validez: z.string().min(1, 'Data de validade é obrigatória'),
  aptidao: z.string().min(1).default('apto'),
  restricciones: optionalText(1000),
  observaciones: optionalText(1000),
  medico: optionalText(255),
  centro_medico: optionalText(255),
});

export type ExameMedicoFormData = z.infer<typeof exameMedicoSchema>;

/* ============================================================
 * Entregas EPI (migration 0001)
 * ============================================================ */

export const entregaEPISchema = z.object({
  colaborador_id: z.string().uuid('Colaborador é obrigatório'),
  epi_tipo: z.string().min(1, 'Tipo de EPI é obrigatório').max(100),
  epi_descripcion: optionalText(255),
  cantidad: z.coerce.number().int('Quantidade deve ser inteiro').min(1, 'Quantidade mínima 1').default(1),
  talla: optionalText(50),
  marca: optionalText(100),
  modelo: optionalText(100),
  fecha_entrega: z.string().min(1, 'Data de entrega é obrigatória'),
  fecha_validez: optionalDate,
  estado: z.string().min(1).default('entregado'),
  observaciones: optionalText(1000),
});

export type EntregaEPIFormData = z.infer<typeof entregaEPISchema>;
