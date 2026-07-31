/**
 * Schema Zod + tipos TypeScript para o formulário de colaborador.
 *
 * Espelha a tabela `colaboradores` da migration 0001_rh_initial.sql
 * (apenas os campos editáveis pelo utilizador na criação).
 */
import { z } from 'zod';

// =====================================================
// Validadores específicos (Espanha)
// =====================================================

/**
 * NIF español: 8 dígitos + letra, OU começando por X/Y/Z (NIE).
 * O cálculo da letra segue o algoritmo oficial (módulo 23).
 */
export const isValidNIF = (nif: string): boolean => {
  if (!/^[XYZ0-9][0-9]{6,7}[A-Z]$/.test(nif)) return false;
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const first = nif.charAt(0);
  // NIE (X/Y/Z): a letra calcula-se a partir do dígito mapeado (X→0, Y→1, Z→2)
  // seguido dos 7 dígitos. Ex: Y0719810 → 1 + 0719810 = 10719810.
  const number =
    first === 'X' || first === 'Y' || first === 'Z'
      ? parseInt({ X: '0', Y: '1', Z: '2' }[first] + nif.substring(1, 8), 10)
      : parseInt(nif.substring(0, 8), 10);
  const expected = letters[number % 23];
  return expected === nif.charAt(8);
};

/**
 * NIE español: X/Y/Z + 7 dígitos + letra.
 */
export const isValidNIE = (nie: string): boolean => {
  return /^[XYZ][0-9]{7}[A-Z]$/.test(nie) && isValidNIF(nie);
};

/**
 * IBAN espanhol: 2 letras (ES) + 2 dígitos + 20-22 caracteres alfanuméricos.
 */
export const isValidIBAN = (iban: string): boolean => {
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban);
};

/**
 * Email simples (Zod tem validação built-in, mas garantimos lowercase).
 */
const emailSchema = z
  .string()
  .min(1, 'Email é obrigatório')
  .email('Email inválido')
  .transform((v) => v.toLowerCase());

// =====================================================
// Enums (espelham os CHECK constraints da migration)
// =====================================================

export const tipoContratoEnum = z.enum([
  'indefinido',
  'temporal',
  'formacao',
  'pratica',
  'fixo_discontinuo',
  'obra_servico',
]);
export type TipoContrato = z.infer<typeof tipoContratoEnum>;

export const jornadaEnum = z.enum(['completa', 'parcial', 'reduzida', 'intensiva']);
export type Jornada = z.infer<typeof jornadaEnum>;

export const estadoColaboradorEnum = z.enum([
  'ativo',
  'baixa',
  'ferias',
  'suspenso',
  'inativo',
]);
export type EstadoColaborador = z.infer<typeof estadoColaboradorEnum>;

export const roleUtilizadorEnum = z.enum([
  'admin',
  'rh',
  'financeiro',
  'encarregado',
  'colaborador',
  'auditor',
]);
export type RoleUtilizador = z.infer<typeof roleUtilizadorEnum>;

// =====================================================
// Schema principal do formulário
// =====================================================

export const colaboradorBaseSchema = z.object({
  // Dados pessoais
  // NOTA: NIF/NIE são opcionais e SEM validação de formato — o colaborador
  // pode ainda não ter a documentação completa no momento do cadastro.
  nif: z
    .string()
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v ?? null)),

  nie: z
    .string()
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v ?? null)),

  passaporte: z
    .string()
    .max(50)
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v ?? null)),

  nombre: z.string().min(1, 'Nome é obrigatório').max(100),
  apellido1: z.string().min(1, 'Apelido é obrigatório').max(100),
  apellido2: z.string().max(100).optional().or(z.literal('')),

  fecha_nacimiento: z
    .string()
    .min(1, 'Data de nascimento é obrigatória')
    .refine((d) => new Date(d) < new Date(), 'Data de nascimento deve ser no passado'),

  nacionalidad: z.string().max(50).default('ES'),
  estado_civil: z.string().max(30).optional().or(z.literal('')),
  sexo: z
    .enum(['M', 'F', 'O'])
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v ?? null)),

  // Contacto
  email: emailSchema,
  telefono: z.string().max(20).optional().or(z.literal('')),
  telefono_emergencia: z.string().max(20).optional().or(z.literal('')),
  contacto_emergencia: z.string().max(100).optional().or(z.literal('')),
  direccion: z.string().max(200).optional().or(z.literal('')),
  codigo_postal: z.string().max(10).optional().or(z.literal('')),
  ciudad: z.string().max(100).optional().or(z.literal('')),
  provincia: z.string().max(100).optional().or(z.literal('')),
  pais: z.string().max(50).default('ES'),

  // Dados profissionais
  fecha_admision: z
    .string()
    .min(1, 'Data de admissão é obrigatória')
    .refine((d) => new Date(d) <= new Date(), 'Data de admissão não pode ser futura'),

  fecha_fin_contrato: z
    .string()
    .nullish()
    .or(z.literal(''))
    .refine(
      (d) => !d || new Date(d) >= new Date('1900-01-01'),
      'Data inválida'
    )
    .transform((d) => (d === '' ? null : d ?? null)),

  estado: estadoColaboradorEnum.default('ativo'),
  tipo_contrato: tipoContratoEnum,
  jornada: jornadaEnum.default('completa'),
  horas_semanales: z
    .number()
    .min(1, 'Horas semanais deve ser > 0')
    .max(40, 'Máximo 40 horas semanais'),

  categoria_profesional: z.string().max(100).optional().or(z.literal('')),
  departamento_id: z
    .string()
    .uuid()
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v ?? null)),
  puesto: z.string().max(100).optional().or(z.literal('')),

  salario_base: z
    .number()
    .min(1, 'Salário base deve ser maior que 0')
    .max(100000, 'Salário base demasiado alto'),

  nivel_profesional: z.string().max(50).optional().or(z.literal('')),
  convenio_aplicable: z
    .string()
    .max(150)
    .default('Convenio Nacional Mataderos'),

  // Dados bancários
  iban: z
    .string()
    .refine((v) => !v || isValidIBAN(v), { message: 'IBAN inválido' })
    .nullish()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v ?? null)),
  banco_nombre: z.string().max(100).optional().or(z.literal('')),

  // Segurança Social
  numero_seguridad_social: z.string().max(20).optional().or(z.literal('')),
  mutua: z.string().max(100).optional().or(z.literal('')),

  // Acesso ao portal (não são colunas de colaboradores — tratadas na action)
  criar_acesso: z.boolean().default(true),
  role: roleUtilizadorEnum.default('colaborador'),
  password: z
    .string()
    .min(8, 'A password deve ter pelo menos 8 caracteres')
    .optional()
    .or(z.literal('')),
  confirmar_password: z.string().optional().or(z.literal('')),
});

export const colaboradorSchema = colaboradorBaseSchema.superRefine((data, ctx) => {
  if (!data.criar_acesso) return;

  if (!data.password || data.password.length < 8) {
    ctx.addIssue({
      code: 'custom',
      path: ['password'],
      message: 'A password é obrigatória (mínimo 8 caracteres)',
    });
  }

  if (data.password !== data.confirmar_password) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmar_password'],
      message: 'As passwords não coincidem',
    });
  }
});

export type ColaboradorFormData = z.infer<typeof colaboradorSchema>;

/**
 * Schema simplificado para atualização (campos opcionais).
 */
export const colaboradorUpdateSchema = colaboradorBaseSchema.partial();
export type ColaboradorUpdateData = z.infer<typeof colaboradorUpdateSchema>;