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

export interface Empresa {
  id: string;
  // Identificação
  nombre: string;
  nombre_comercial: string | null;
  cif_nif: string | null;
  iva: number | null;
  // Contacto
  direccion: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  pais: string;
  telefono: string | null;
  correo: string | null;
  web: string | null;
  // Logotipo
  logotipo_url: string | null;
  // Banca
  banco: string | null;
  iban: string | null;
  swift: string | null;
  // Responsáveis
  responsable_direccion: string | null;
  responsable_rrhh: string | null;
  responsable_finanzas: string | null;
  responsable_operaciones: string | null;
  // Auditoria
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Alojamiento {
  id: string;
  empresa_id: string | null;
  codigo: string | null;
  nombre: string;
  tipo: string;
  capacidad: number | null;
  direccion: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  pais: string;
  renda_mensal: number | null;
  responsable: string | null;
  estado: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AlojamientoCompleto extends Alojamiento {
  empresas?: { nombre: string | null } | null;
}

export interface Habitacion {
  id: string;
  alojamiento_id: string;
  numero: string;
  nombre: string | null;
  tipo: string;
  capacidad: number;
  estado: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface HabitacionCompleto extends Habitacion {
  alojamientos?: { nombre: string | null } | null;
}

export interface Ocupacion {
  id: string;
  alojamiento_id: string;
  habitacion_id: string | null;
  colaborador_id: string;
  data_entrada: string;
  data_saida: string | null;
  estado: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OcupacionCompleto extends Ocupacion {
  alojamientos?: { nombre: string | null } | null;
  habitaciones?: { numero: string | null } | null;
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

export interface Inventario {
  id: string;
  alojamiento_id: string;
  habitacion_id: string | null;
  nombre: string;
  categoria: string;
  quantidade: number;
  estado: string;
  valor: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface InventarioCompleto extends Inventario {
  habitaciones?: { numero: string | null } | null;
}

export interface Fotografia {
  id: string;
  alojamiento_id: string;
  habitacion_id: string | null;
  url: string;
  nombre: string | null;
  mime_type: string | null;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FotografiaCompleto extends Fotografia {
  habitaciones?: { numero: string | null } | null;
}

export interface Incidencia {
  id: string;
  alojamiento_id: string;
  habitacion_id: string | null;
  colaborador_id: string | null;
  tipo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  fecha: string;
  fecha_resolucion: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IncidenciaCompleto extends Incidencia {
  habitaciones?: { numero: string | null } | null;
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

export interface ContratoArrendamento {
  id: string;
  codigo: string | null;
  alojamiento_id: string;
  habitacion_id: string | null;
  colaborador_id: string;
  data_inicio: string;
  data_fim: string | null;
  renda: number | null;
  estado: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ContratoArrendamentoCompleto extends ContratoArrendamento {
  habitaciones?: { numero: string | null } | null;
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

export interface Consumo {
  id: string;
  alojamiento_id: string;
  tipo: string;
  data: string;
  leitura_anterior: number | null;
  leitura_atual: number | null;
  importe: number | null;
  fornecedor: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
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
  nome_completo: string | null;
  telefone: string | null;
  ativo: boolean;
  ultimo_acesso: string | null;
  totp_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissoesMenus {
  user_id: string;
  menus: string[];
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

/* ============================================================
 * Finanzas
 * ============================================================ */

export interface Cliente {
  id: string;
  nombre: string;
  cif_nif: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  pais: string;
  estado: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Fatura {
  id: string;
  numero: string;
  cliente_id: string;
  empresa_id: string | null;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  estado: string;
  base_imponible: number;
  iva: number;
  total: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FaturaCompleto extends Fatura {
  clientes?: { nombre: string | null } | null;
  empresas?: { nombre: string | null; nombre_comercial: string | null } | null;
}

export interface FaturaItem {
  id: string;
  fatura_id: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  iva_pct: number;
  importe: number;
  created_at: string;
  updated_at: string;
}

export interface Cobro {
  id: string;
  fatura_id: string;
  data: string;
  importe: number;
  metodo_pago: string;
  referencia: string | null;
  estado: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CobroCompleto extends Cobro {
  faturas?: { numero: string | null } | null;
}

export interface Pago {
  id: string;
  empresa_id: string | null;
  concepto: string;
  data: string;
  importe: number;
  categoria: string;
  metodo_pago: string;
  referencia: string | null;
  estado: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Despesa {
  id: string;
  empresa_id: string | null;
  cliente_id: string | null;
  categoria: string;
  concepto: string;
  data: string;
  importe: number;
  iva: number;
  fornecedor: string | null;
  forma_pago: string;
  estado: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DespesaCompleto extends Despesa {
  clientes?: { nombre: string | null } | null;
}

export interface Presupuesto {
  id: string;
  numero: string;
  cliente_id: string | null;
  titulo: string;
  data: string;
  validade: string | null;
  estado: string;
  base_imponible: number;
  iva: number;
  total: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PresupuestoCompleto extends Presupuesto {
  clientes?: { nombre: string | null } | null;
}

export interface PresupuestoItem {
  id: string;
  presupuesto_id: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  iva_pct: number;
  importe: number;
  created_at: string;
  updated_at: string;
}

export interface Nomina {
  id: string;
  colaborador_id: string;
  mes: number;
  ano: number;
  salario_base: number;
  horas_extra_importe: number;
  complementos: number;
  irpf: number;
  seguranca_social: number;
  outras_deducoes: number;
  liquido: number;
  estado: string;
  fecha_pago: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NominaCompleto extends Nomina {
  colaboradores?: {
    nombre: string | null;
    apellido1: string | null;
    apellido2: string | null;
  } | null;
}

export interface HoraExtra {
  id: string;
  colaborador_id: string;
  data: string;
  horas: number;
  tipo: string;
  valor_hora: number;
  importe: number;
  estado: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface HoraExtraCompleto extends HoraExtra {
  colaboradores?: {
    nombre: string | null;
    apellido1: string | null;
    apellido2: string | null;
  } | null;
}

export interface FlujoCajaRow {
  data: string;
  tipo: 'entrada' | 'salida';
  concepto: string;
  importe: number;
  referencia: string | null;
}

export interface RentabilidadCliente {
  cliente_id: string;
  cliente: string;
  facturado: number;
  cobrado: number;
  costes: number;
  beneficio: number;
}

export interface DocumentoFinanzas {
  id: string;
  categoria: string;
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

export type EstadoContrato = 'borrador' | 'ativo' | 'vencido' | 'rescindido' | 'anulado';

export interface ContratoGeral {
  id: string;
  numero: string;
  empresa_id: string | null;
  cliente_id: string | null;
  colaborador_id: string | null;
  data_inicio: string;
  data_fim: string | null;
  renovaciones: number | null;
  renovacion_automatica: boolean | null;
  estado: EstadoContrato;
  observacoes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContratoGeralCompleto extends ContratoGeral {
  empresas?: { nombre: string | null; nombre_comercial: string | null } | null;
  clientes?: { nombre: string | null } | null;
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

export interface ContratoDocumento {
  id: string;
  contrato_id: string;
  categoria: string;
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

export interface ContratoFirma {
  id: string;
  contrato_id: string;
  tipo: string;
  nombre: string;
  cargo: string | null;
  dni: string | null;
  data_firma: string | null;
  estado: string;
  created_at: string;
  updated_at: string;
}

/* ============================================================
 * Módulo RH ampliado (migration 0015)
 * ============================================================ */

export type TipoAusencia = 'ausencia' | 'baixa_medica' | 'permiso' | 'otra';
export type EstadoAusencia = 'pendiente' | 'justificada' | 'injustificada' | 'cancelada';

export interface Ausencia {
  id: string;
  colaborador_id: string;
  tipo: TipoAusencia;
  data_inicio: string;
  data_fim: string | null;
  dias: number | null;
  motivo: string | null;
  justificada: boolean;
  justificante_url: string | null;
  estado: EstadoAusencia;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AusenciaCompleto extends Ausencia {
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

export type EstadoCurso = 'programado' | 'en_curso' | 'completado' | 'cancelado';

export interface Curso {
  id: string;
  colaborador_id: string;
  nombre: string;
  entidad: string | null;
  horas: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  estado: EstadoCurso;
  certificado_url: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CursoCompleto extends Curso {
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

export interface Certificado {
  id: string;
  colaborador_id: string;
  curso_id: string | null;
  nombre: string;
  entidad: string | null;
  tipo: string;
  numero: string | null;
  data_emision: string;
  data_validez: string | null;
  documento_url: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificadoCompleto extends Certificado {
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

export type TipoAdvertencia = 'verbal' | 'escrita';
export type GravidadeAdvertencia = 'leve' | 'grave' | 'muy_grave';
export type EstadoAdvertencia = 'abierta' | 'cerrada';

export interface Advertencia {
  id: string;
  colaborador_id: string;
  tipo: TipoAdvertencia;
  gravidade: GravidadeAdvertencia;
  motivo: string;
  data_advertencia: string;
  documento_url: string | null;
  estado: EstadoAdvertencia;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdvertenciaCompleto extends Advertencia {
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

export type TipoAvaliacao = 'inicial' | 'seguimiento' | 'anual' | 'salida';

export interface Avaliacao {
  id: string;
  colaborador_id: string;
  tipo: TipoAvaliacao;
  periodo: string | null;
  data_avaliacao: string;
  pontuacao: number | null;
  resultados: string | null;
  objetivos: string | null;
  avaliador_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvaliacaoCompleto extends Avaliacao {
  colaboradores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
  avaliadores?: { nombre: string | null; apellido1: string | null; apellido2: string | null } | null;
}

/* ============================================================
 * Flota (veículos)
 * ============================================================ */

export interface FlotaVehiculo {
  id: string;
  matricula: string;
  marca: string;
  modelo: string;
  tipo: string;
  ano: number | null;
  km_actuales: number | null;
  estado: string;
  fecha_compra: string | null;
  fecha_baja: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlotaConductor {
  id: string;
  vehiculo_id: string;
  colaborador_id: string;
  asignado_desde: string;
  asignado_hasta: string | null;
  principal: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlotaITV {
  id: string;
  vehiculo_id: string;
  fecha: string;
  fecha_validez: string | null;
  resultado: string;
  centro: string | null;
  documento_url: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlotaSeguro {
  id: string;
  vehiculo_id: string;
  compania: string;
  poliza: string | null;
  tipo: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  importe: number | null;
  estado: string;
  documento_url: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlotaMantenimiento {
  id: string;
  vehiculo_id: string;
  fecha: string;
  tipo: string;
  descricao: string;
  km: number | null;
  importe: number | null;
  proveedor: string | null;
  factura_url: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlotaCombustible {
  id: string;
  vehiculo_id: string;
  fecha: string;
  litros: number;
  importe: number;
  km: number | null;
  tipo: string;
  colaborador_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlotaKilometraje {
  id: string;
  vehiculo_id: string;
  fecha: string;
  km: number;
  colaborador_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlotaMulta {
  id: string;
  vehiculo_id: string;
  colaborador_id: string | null;
  fecha: string;
  importe: number;
  descricao: string | null;
  lugar: string | null;
  estado: string;
  documento_url: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}
