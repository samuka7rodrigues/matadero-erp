import { z } from 'zod';

/**
 * Schemas Zod para validação de formulários.
 * Usados em ambos front (React Hook Form) e back (Server Actions).
 */

// Validador de NIF español
export const nifSchema = z
  .string()
  .min(9, 'NIF debe tener 9 caracteres')
  .max(9, 'NIF debe tener 9 caracteres')
  .refine((val) => {
    if (!/^[0-9XYZ][0-9]{6,7}[A-Z]$/.test(val)) return false;
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = (() => {
      const first = val.charAt(0);
      if (first === 'X') return 0;
      if (first === 'Y') return 1;
      if (first === 'Z') return 2;
      return parseInt(val.substring(0, 8), 10);
    })();
    const expected = letters[number % 23];
    return expected === val.charAt(8);
  }, { message: 'NIF inválido' });

export const colaboradorSchema = z.object({
  // Pessoais
  nif: nifSchema,
  nie: z.string().optional().nullable(),
  passaporte: z.string().optional().nullable(),
  nombre: z.string().min(2, 'Nombre demasiado corto'),
  apellido1: z.string().min(2, 'Apellido demasiado corto'),
  apellido2: z.string().optional().nullable(),
  fecha_nacimiento: z.coerce.date()
    .refine((d) => d < new Date(), 'Fecha de nacimiento no puede ser futura'),
  nacionalidad: z.string().default('ES'),
  estado_civil: z.enum(['soltero', 'casado', 'divorciado', 'viudo', 'pareja_hecho']).optional().nullable(),
  sexo: z.enum(['M', 'F', 'O']).optional().nullable(),

  // Contacto
  email: z.string().email('Email inválido'),
  telefone: z.string().optional().nullable(),
  telefone_emergencia: z.string().optional().nullable(),
  contacto_emergencia: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  codigo_postal: z.string().regex(/^[0-9]{5}$/, 'CP debe tener 5 dígitos').optional().nullable(),
  ciudad: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  pais: z.string().default('ES'),

  // Profissionais
  fecha_admision: z.coerce.date()
    .refine((d) => d <= new Date(), 'Fecha de admisión no puede ser futura'),
  fecha_fin_contrato: z.coerce.date().optional().nullable(),
  tipo_contrato: z.enum(['indefinido', 'temporal', 'formacao', 'pratica', 'fixo_discontinuo', 'obra_servico']),
  jornada: z.enum(['completa', 'parcial', 'reduzida', 'intensiva']).default('completa'),
  horas_semanales: z.number().min(1).max(40),
  categoria_profesional: z.string().optional().nullable(),
  departamento_id: z.string().uuid().optional().nullable(),
  puesto: z.string().optional().nullable(),
  salario_base: z.number()
    .min(1134, 'Salario no puede ser inferior al SMI (1.134€/mês em 14 pagamentos)'),
  convenio_aplicable: z.string().default('Convenio Nacional Mataderos'),

  // Bancários
  iban: z.string()
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/, 'IBAN inválido')
    .optional()
    .nullable(),

  // SS
  numero_seguridad_social: z.string().optional().nullable(),
  mutua: z.string().optional().nullable(),
}).refine(
  (data) => !data.fecha_fin_contrato || data.fecha_fin_contrato >= data.fecha_admision,
  {
    message: 'Fecha fin de contrato debe ser posterior a fecha de admisión',
    path: ['fecha_fin_contrato'],
  }
);

export type ColaboradorFormData = z.infer<typeof colaboradorSchema>;
