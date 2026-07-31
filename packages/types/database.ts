/**
 * Tipos TypeScript gerados a partir do schema Supabase.
 *
 * Mantém sincronizado com:
 * - supabase/migrations/0001_rh_initial.sql
 * - supabase/migrations/0002_rh_util_functions.sql
 *
 * Em produção, regenerar com: `supabase gen types typescript`
 */

export type EstadoColaborador = 'ativo' | 'baixa' | 'ferias' | 'suspenso' | 'inativo';
export type TipoContrato = 'indefinido' | 'temporal' | 'formacao' | 'pratica' | 'fixo_discontinuo' | 'obra_servico';
export type TipoJornada = 'completa' | 'parcial' | 'reduzida' | 'intensiva';
export type TipoDocumento = 'dni' | 'nie' | 'contrato' | 'exame_medico' | 'epi' | 'outro';
export type AptidaoMedica = 'apto' | 'no_apto' | 'apto_con_restricciones';
export type RoleUtilizador = 'admin' | 'rh' | 'financeiro' | 'encarregado' | 'colaborador' | 'auditor';
export type EstadoFerias = 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
export type TipoMarcacao = 'entrada' | 'saida' | 'inicio_almoco' | 'volta_almoco' | 'saida_emergencia';
export type TipoTurno = 'manha' | 'tarde' | 'noite' | 'misto' | 'rotativo';

export interface Departamento {
  id: string;
  nombre: string;
  codigo: string;
  responsable_id: string | null;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Colaborador {
  id: string;
  // Pessoais
  nif: string;
  nie: string | null;
  passaporte: string | null;
  nombre: string;
  apellido1: string;
  apellido2: string | null;
  fecha_nacimiento: string;
  nacionalidad: string;
  estado_civil: string | null;
  sexo: 'M' | 'F' | 'O' | null;
  // Contacto
  email: string;
  telefono: string | null;
  telefono_emergencia: string | null;
  contacto_emergencia: string | null;
  direccion: string | null;
  codigo_postal: string | null;
  ciudad: string | null;
  provincia: string | null;
  pais: string;
  // Profissionais
  fecha_admision: string;
  fecha_fin_contrato: string | null;
  estado: EstadoColaborador;
  tipo_contrato: TipoContrato;
  jornada: TipoJornada;
  horas_semanales: number;
  categoria_profesional: string | null;
  departamento_id: string | null;
  puesto: string | null;
  salario_base: number;
  nivel_profesional: string | null;
  convenio_aplicable: string | null;
  // Bancários
  iban: string | null;
  banco_nombre: string | null;
  // SS
  numero_seguridad_social: string | null;
  mutua: string | null;
  // Foto
  foto_url: string | null;
  // Auditoria
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ColaboradorCompleto extends Colaborador {
  departamento_nombre?: string;
  departamentos?: { nombre: string | null; codigo: string | null } | null;
  dias_para_fim?: number;
}

export interface Contrato {
  id: string;
  colaborador_id: string;
  tipo: TipoContrato;
  fecha_inicio: string;
  fecha_fin: string | null;
  jornada: TipoJornada;
  horas_semanales: number;
  salario_base: number;
  categoria_profesional: string | null;
  departamento_id: string | null;
  puesto: string | null;
  convenio: string | null;
  numero_contrato: string | null;
  documento_url: string | null;
  observaciones: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentoColaborador {
  id: string;
  colaborador_id: string;
  tipo: TipoDocumento;
  nombre: string;
  descripcion: string | null;
  archivo_url: string;
  archivo_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ExameMedico {
  id: string;
  colaborador_id: string;
  fecha_examen: string;
  fecha_validez: string;
  aptidao: AptidaoMedica;
  restricciones: string | null;
  observaciones: string | null;
  medico: string | null;
  centro_medico: string | null;
  documento_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntregaEPI {
  id: string;
  colaborador_id: string;
  epi_tipo: string;
  epi_descripcion: string | null;
  cantidad: number;
  talla: string | null;
  marca: string | null;
  modelo: string | null;
  fecha_entrega: string;
  fecha_validez: string | null;
  estado: string;
  firma_url: string | null;
  observaciones: string | null;
  created_at: string;
}

export interface Utilizador {
  id: string;
  user_id: string;
  colaborador_id: string | null;
  role: RoleUtilizador;
  email: string;
  ativo: boolean;
  ultimo_acesso: string | null;
  totp_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ferias {
  id: string;
  colaborador_id: string;
  data_inicio: string;
  data_fim: string;
  dias: number;
  tipo: string;
  estado: EstadoFerias;
  solicitado_em: string;
  solicitado_por: string | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  motivo_rejeicao: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarcacaoPonto {
  id: string;
  colaborador_id: string;
  data_hora: string;
  tipo: TipoMarcacao;
  geolocalizacao: string | null;
  endereco_ip: string | null;
  dispositivo: string | null;
  user_agent: string | null;
  validada: boolean;
  correcao: boolean;
  corrigido_por: string | null;
  corrigido_em: string | null;
  motivo_correcao: string | null;
  created_at: string;
}

export interface Turno {
  id: string;
  colaborador_id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  tipo: TipoTurno;
  departamento_id: string | null;
  puesto: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  acao: string;
  tabela: string;
  registo_id: string | null;
  dados_anteriores: any;
  dados_novos: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
