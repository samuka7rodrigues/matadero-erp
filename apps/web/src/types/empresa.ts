/**
 * Schema Zod + tipos TypeScript para o formulário de empresa.
 *
 * Espelha a tabela `empresas` da migration 0008_empresa.sql
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

const optionalEmail = z
  .string()
  .email('Email inválido')
  .nullish()
  .or(z.literal(''))
  .transform((v) => (v === '' ? null : v ?? null));

export const empresaSchema = z.object({
  // Identificação
  nombre: z.string().min(1, 'Nome é obrigatório').max(150),
  nombre_comercial: optionalText(150),
  cif_nif: optionalText(9)
    .refine((v) => !v || /^[A-Z0-9]{9}$/.test(v), {
      message: 'CIF/NIF deve ter 9 caracteres alfanuméricos',
    }),
  iva: z.coerce.number().min(0, 'IVA não pode ser negativo').max(100, 'IVA máximo 100%'),

  // Contacto
  direccion: optionalText(200),
  ciudad: optionalText(100),
  codigo_postal: optionalText(10)
    .refine((v) => !v || /^[0-9]{4,5}$/.test(v), {
      message: 'Código postal inválido',
    }),
  pais: z.string().max(50).default('ES'),
  telefono: optionalText(20),
  correo: optionalEmail,
  web: optionalText(200).refine(
    (v) => !v || /^https?:\/\/.+/.test(v),
    { message: 'URL inválida (use https://...)' }
  ),

  // Banca
  banco: optionalText(100),
  iban: optionalText(34).refine(
    (v) => !v || /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(v),
    { message: 'IBAN inválido' }
  ),
  swift: optionalText(11).refine(
    (v) => !v || /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v),
    { message: 'SWIFT/BIC inválido' }
  ),

  // Responsáveis
  responsable_direccion: optionalText(150),
  responsable_rrhh: optionalText(150),
  responsable_finanzas: optionalText(150),
  responsable_operaciones: optionalText(150),
});

export type EmpresaFormData = z.infer<typeof empresaSchema>;
