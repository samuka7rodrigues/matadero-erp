/**
 * Schemas Zod + tipos TypeScript para o módulo Finanzas.
 *
 * Espelham as tabelas das migrations 0011 e 0012:
 * - clientes, faturas, fatura_itens, cobros, pagos, despesas
 * - presupuestos, presupuesto_itens, nominas, horas_extras
 */
import { z } from 'zod';

const optionalText = (max = 255) =>
  z
    .string()
    .max(max)
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v ?? null));

const optionalEmail = z
  .string()
  .email('Email inválido')
  .nullish()
  .or(z.literal(''))
  .transform((v) => (v === '' ? null : v ?? null));

const optionalDate = z.string().nullish().or(z.literal('')).transform((v) => v || null);

/* ============================================================
 * Clientes
 * ============================================================ */

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'Nome é obrigatório').max(150),
  cif_nif: optionalText(20),
  email: optionalEmail,
  telefono: optionalText(20),
  direccion: optionalText(200),
  ciudad: optionalText(100),
  codigo_postal: optionalText(10)
    .refine((v) => !v || /^[0-9]{4,5}$/.test(v), { message: 'Código postal inválido' }),
  pais: z.string().max(10).default('ES'),
  estado: z.string().max(20).default('ativo'),
  observacoes: optionalText(1000),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

/* ============================================================
 * Faturas + itens
 * ============================================================ */

export const faturaItemSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória').max(255),
  quantidade: z.coerce.number().positive('Quantidade deve ser > 0'),
  preco_unitario: z.coerce.number().min(0, 'Preço não pode ser negativo'),
  iva_pct: z.coerce.number().min(0, 'IVA não pode ser negativo').max(100, 'IVA máximo 100%').default(21),
});

export type FaturaItemFormData = z.infer<typeof faturaItemSchema>;

export const faturaSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório').max(50),
  cliente_id: z.string().uuid('Cliente é obrigatório'),
  empresa_id: optionalText(50),
  fecha_emision: z.string().min(1, 'Data de emissão é obrigatória'),
  fecha_vencimiento: optionalDate,
  estado: z.string().max(20).default('borrador'),
  observacoes: optionalText(1000),
  itens: z.array(faturaItemSchema).min(1, 'Adiciona pelo menos um item'),
});

export type FaturaFormData = z.infer<typeof faturaSchema>;

/* ============================================================
 * Cobros
 * ============================================================ */

export const cobroSchema = z.object({
  fatura_id: z.string().uuid('Fatura é obrigatória'),
  data: z.string().min(1, 'Data é obrigatória'),
  importe: z.coerce.number().positive('Importe deve ser > 0'),
  metodo_pago: z.string().max(20).default('transferencia'),
  referencia: optionalText(100),
  estado: z.string().max(20).default('registrado'),
  observacoes: optionalText(1000),
});

export type CobroFormData = z.infer<typeof cobroSchema>;

/* ============================================================
 * Pagos
 * ============================================================ */

export const pagoSchema = z.object({
  empresa_id: optionalText(50),
  concepto: z.string().min(1, 'Concepto é obrigatório').max(255),
  data: z.string().min(1, 'Data é obrigatória'),
  importe: z.coerce.number().positive('Importe deve ser > 0'),
  categoria: z.string().max(30).default('operacional'),
  metodo_pago: z.string().max(20).default('transferencia'),
  referencia: optionalText(100),
  estado: z.string().max(20).default('registrado'),
  observacoes: optionalText(1000),
});

export type PagoFormData = z.infer<typeof pagoSchema>;

/* ============================================================
 * Despesas
 * ============================================================ */

export const despesaSchema = z.object({
  empresa_id: optionalText(50),
  cliente_id: optionalText(50),
  categoria: z.string().max(30).default('servicios'),
  concepto: z.string().min(1, 'Concepto é obrigatório').max(255),
  data: z.string().min(1, 'Data é obrigatória'),
  importe: z.coerce.number().positive('Importe deve ser > 0'),
  iva: z.coerce.number().min(0, 'IVA não pode ser negativo').default(0),
  fornecedor: optionalText(150),
  forma_pago: z.string().max(20).default('transferencia'),
  estado: z.string().max(20).default('registrado'),
  observacoes: optionalText(1000),
});

export type DespesaFormData = z.infer<typeof despesaSchema>;

/* ============================================================
 * Presupuestos + itens
 * ============================================================ */

export const presupuestoItemSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória').max(255),
  quantidade: z.coerce.number().positive('Quantidade deve ser > 0'),
  preco_unitario: z.coerce.number().min(0, 'Preço não pode ser negativo'),
  iva_pct: z.coerce.number().min(0, 'IVA não pode ser negativo').max(100, 'IVA máximo 100%').default(21),
});

export type PresupuestoItemFormData = z.infer<typeof presupuestoItemSchema>;

export const presupuestoSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório').max(50),
  cliente_id: optionalText(50),
  titulo: z.string().min(1, 'Título é obrigatório').max(255),
  data: z.string().min(1, 'Data é obrigatória'),
  validade: optionalDate,
  estado: z.string().max(20).default('enviado'),
  observacoes: optionalText(1000),
  itens: z.array(presupuestoItemSchema).min(1, 'Adiciona pelo menos um item'),
});

export type PresupuestoFormData = z.infer<typeof presupuestoSchema>;

/* ============================================================
 * Nóminas
 * ============================================================ */

export const nominaSchema = z.object({
  colaborador_id: z.string().uuid('Colaborador é obrigatório'),
  mes: z.coerce.number().int('Mês inválido').min(1).max(12),
  ano: z.coerce.number().int('Ano inválido').min(2000).max(2100),
  salario_base: z.coerce.number().min(0, 'Salário não pode ser negativo'),
  horas_extra_importe: z.coerce.number().min(0).default(0),
  complementos: z.coerce.number().min(0).default(0),
  irpf: z.coerce.number().min(0).default(0),
  seguranca_social: z.coerce.number().min(0).default(0),
  outras_deducoes: z.coerce.number().min(0).default(0),
  liquido: z.coerce.number().min(0).default(0),
  estado: z.string().max(20).default('calculada'),
  fecha_pago: optionalDate,
  observacoes: optionalText(1000),
});

export type NominaFormData = z.infer<typeof nominaSchema>;

/* ============================================================
 * Horas extras
 * ============================================================ */

export const horaExtraSchema = z.object({
  colaborador_id: z.string().uuid('Colaborador é obrigatório'),
  data: z.string().min(1, 'Data é obrigatória'),
  horas: z.coerce.number().positive('Horas devem ser > 0'),
  tipo: z.string().max(20).default('normal'),
  valor_hora: z.coerce.number().min(0, 'Valor hora não pode ser negativo'),
  estado: z.string().max(20).default('registrada'),
  observacoes: optionalText(1000),
});

export type HoraExtraFormData = z.infer<typeof horaExtraSchema>;
