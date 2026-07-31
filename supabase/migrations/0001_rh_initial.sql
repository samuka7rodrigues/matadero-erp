-- ============================================================
-- ERP Matadero — Módulo RH (Recursos Humanos)
-- Migration 0001: Schema inicial do módulo RH
-- Data: 2026-07-31
-- ============================================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";          -- emails case-insensitive

-- ============================================================
-- ENUMS
-- ============================================================

-- Estados do colaborador
CREATE TYPE estado_colaborador AS ENUM (
  'ativo',
  'baixa',
  'ferias',
  'suspenso',
  'inativo'
);

-- Tipos de contrato (códigos equivalentes a SEPE)
CREATE TYPE tipo_contrato AS ENUM (
  'indefinido',
  'temporal',
  'formacao',
  'pratica',
  'fixo_discontinuo',
  'obra_servico'
);

-- Tipos de jornada
CREATE TYPE tipo_jornada AS ENUM (
  'completa',
  'parcial',
  'reduzida',
  'intensiva'
);

-- Tipos de documento
CREATE TYPE tipo_documento AS ENUM (
  'dni',
  'nie',
  'contrato',
  'exame_medico',
  'epi',
  'outro'
);

-- Aptidão médica
CREATE TYPE aptidao_medica AS ENUM (
  'apto',
  'no_apto',
  'apto_con_restricciones'
);

-- ============================================================
-- TABELA: departamentos
-- ============================================================

CREATE TABLE departamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  responsable_id UUID,             -- FK para colaboradores (adic. depois)
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE departamentos IS 'Departamentos do matadouro (ex: Sacrificio, Despiece, Expedición, Administración...)';

-- ============================================================
-- TABELA: colaboradores (coração do módulo)
-- ============================================================

CREATE TABLE colaboradores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Dados pessoais
  nif TEXT UNIQUE NOT NULL,
  nie TEXT,                         -- NIE para estrangeiros
  nombre TEXT NOT NULL,
  apellido1 TEXT NOT NULL,
  apellido2 TEXT,
  fecha_nacimiento DATE NOT NULL,
  nacionalidad TEXT DEFAULT 'ES',
  estado_civil TEXT,
  sexo TEXT CHECK (sexo IN ('M', 'F', 'O')),

  -- Contacto
  email CITEXT UNIQUE NOT NULL,
  telefono TEXT,
  telefono_emergencia TEXT,
  contacto_emergencia TEXT,
  direccion TEXT,
  codigo_postal TEXT,
  ciudad TEXT,
  provincia TEXT,
  pais TEXT DEFAULT 'ES',

  -- Dados profissionais
  fecha_admision DATE NOT NULL,
  fecha_fin_contrato DATE,
  estado estado_colaborador DEFAULT 'ativo',
  tipo_contrato tipo_contrato NOT NULL,
  jornada tipo_jornada DEFAULT 'completa',
  horas_semanales NUMERIC(5,2) DEFAULT 40,
  categoria_profesional TEXT,       -- ex: 'Cortador', 'Deshuesador'
  departamento_id UUID REFERENCES departamentos(id),
  puesto TEXT,                      -- cargo específico
  salario_base NUMERIC(10,2) NOT NULL,
  nivel_profesional TEXT,
  convenio_aplicable TEXT DEFAULT 'Convenio Nacional Mataderos',

  -- Dados bancários
  iban TEXT,
  banco_nombre TEXT,

  -- Segurança Social
  numero_seguridad_social TEXT UNIQUE,
  mutua TEXT,

  -- Foto
  foto_url TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,           -- soft delete

  -- Constraints
  CONSTRAINT chk_nif_formato CHECK (nif ~ '^[0-9XYZ][0-9]{6,7}[A-Z]$' OR nif ~ '^[A-HJNP-SUVW][0-9]{7}[A-J0-9]$'),
  CONSTRAINT chk_fecha_nacimiento CHECK (fecha_nacimiento < CURRENT_DATE),
  CONSTRAINT chk_fecha_admision CHECK (fecha_admision <= CURRENT_DATE),
  CONSTRAINT chk_horas_semanales CHECK (horas_semanales > 0 AND horas_semanales <= 40),
  CONSTRAINT chk_iban_formato CHECK (iban IS NULL OR iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$')
);

COMMENT ON TABLE colaboradores IS 'Cadastro principal de colaboradores do matadouro';

-- Índices para performance
CREATE INDEX idx_colaboradores_nif ON colaboradores(nif);
CREATE INDEX idx_colaboradores_nombre ON colaboradores(nombre, apellido1);
CREATE INDEX idx_colaboradores_estado ON colaboradores(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_colaboradores_departamento ON colaboradores(departamento_id);
CREATE INDEX idx_colaboradores_admision ON colaboradores(fecha_admision);
CREATE INDEX idx_colaboradores_email ON colaboradores(email);
CREATE INDEX idx_colaboradores_fin_contrato ON colaboradores(fecha_fin_contrato)
  WHERE estado = 'ativo' AND fecha_fin_contrato IS NOT NULL;

-- ============================================================
-- TABELA: historico_contratos
-- ============================================================

CREATE TABLE contratos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo tipo_contrato NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  jornada tipo_jornada NOT NULL,
  horas_semanales NUMERIC(5,2) NOT NULL,
  salario_base NUMERIC(10,2) NOT NULL,
  categoria_profesional TEXT,
  departamento_id UUID REFERENCES departamentos(id),
  puesto TEXT,
  convenio TEXT,
  numero_contrato TEXT UNIQUE,
  documento_url TEXT,
  observaciones TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_fechas_contrato CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_contratos_colaborador ON contratos(colaborador_id);
CREATE INDEX idx_contratos_fecha_fin ON contratos(fecha_fin) WHERE activo = TRUE;

-- ============================================================
-- TABELA: documentos_colaborador
-- ============================================================

CREATE TABLE documentos_colaborador (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo tipo_documento NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  archivo_url TEXT NOT NULL,
  archivo_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID,
  expires_at DATE,                  -- para documentos com validade (exame médico, EPI)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documentos_colaborador ON documentos_colaborador(colaborador_id);
CREATE INDEX idx_documentos_tipo ON documentos_colaborador(tipo);
CREATE INDEX idx_documentos_expira ON documentos_colaborador(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- TABELA: exames_medicos
-- ============================================================

CREATE TABLE exames_medicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  fecha_examen DATE NOT NULL,
  fecha_validez DATE NOT NULL,
  aptidao aptidao_medica NOT NULL,
  restricciones TEXT,
  observaciones TEXT,
  medico TEXT,
  centro_medico TEXT,
  documento_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exames_colaborador ON exames_medicos(colaborador_id);
CREATE INDEX idx_exames_validez ON exames_medicos(fecha_validez);

-- ============================================================
-- TABELA: entregas_epi
-- ============================================================

CREATE TABLE entregas_epi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  epi_tipo TEXT NOT NULL,           -- 'botas', 'guantes_anticorte', 'casco', etc.
  epi_descripcion TEXT,
  cantidad INTEGER DEFAULT 1,
  talla TEXT,
  marca TEXT,
  modelo TEXT,
  fecha_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_validez DATE,
  estado TEXT DEFAULT 'entregado',  -- 'entregado', 'devuelto', 'sustituido'
  firma_url TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_epis_colaborador ON entregas_epi(colaborador_id);
CREATE INDEX idx_epis_tipo ON entregas_epi(epi_tipo);

-- ============================================================
-- TABELA: utilizadores (auth + roles)
-- ============================================================
-- Ligada ao auth.users do Supabase por user_id

CREATE TYPE role_utilizador AS ENUM (
  'admin',
  'rh',
  'financeiro',
  'encarregado',
  'colaborador',
  'auditor'
);

CREATE TABLE utilizadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  role role_utilizador NOT NULL DEFAULT 'colaborador',
  email CITEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  ultimo_acesso TIMESTAMPTZ,
  totp_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_utilizadores_user ON utilizadores(user_id);
CREATE INDEX idx_utilizadores_colaborador ON utilizadores(colaborador_id);
CREATE INDEX idx_utilizadores_role ON utilizadores(role);

-- ============================================================
-- TABELA: audit_log
-- ============================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  acao TEXT NOT NULL,                -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN'
  tabela TEXT NOT NULL,
  registo_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_audit_tabela ON audit_log(tabela);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_departamentos_updated
  BEFORE UPDATE ON departamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_colaboradores_updated
  BEFORE UPDATE ON colaboradores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_contratos_updated
  BEFORE UPDATE ON contratos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_exames_updated
  BEFORE UPDATE ON exames_medicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_utilizadores_updated
  BEFORE UPDATE ON utilizadores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: audit log automático
-- ============================================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, user_email, acao, tabela, registo_id, dados_novos)
    VALUES (
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, user_email, acao, tabela, registo_id, dados_anteriores, dados_novos)
    VALUES (
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, user_email, acao, tabela, registo_id, dados_anteriores)
    VALUES (
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplica às tabelas principais
CREATE TRIGGER trg_audit_colaboradores
  AFTER INSERT OR UPDATE OR DELETE ON colaboradores
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_contratos
  AFTER INSERT OR UPDATE OR DELETE ON contratos
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_exames
  AFTER INSERT OR UPDATE OR DELETE ON exames_medicos
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- VIEWS: consultas úteis
-- ============================================================

-- Colaboradores ativos com info de vencimento de contrato
CREATE OR REPLACE VIEW v_colaboradores_ativos AS
SELECT
  f.*,
  d.nombre AS departamento_nombre,
  (f.fecha_fin_contrato - CURRENT_DATE)::int AS dias_para_fim
FROM colaboradores f
LEFT JOIN departamentos d ON f.departamento_id = d.id
WHERE f.estado = 'ativo' AND f.deleted_at IS NULL;

-- Exames médicos a vencer (próximos 30 dias)
CREATE OR REPLACE VIEW v_exames_a_vencer AS
SELECT
  em.*,
  f.nombre,
  f.apellido1,
  f.apellido2,
  f.nif,
  (em.fecha_validez - CURRENT_DATE)::int AS dias_para_vencer
FROM exames_medicos em
JOIN colaboradores f ON em.colaborador_id = f.id
WHERE em.fecha_validez >= CURRENT_DATE
  AND em.fecha_validez <= CURRENT_DATE + INTERVAL '30 days'
  AND f.deleted_at IS NULL
ORDER BY em.fecha_validez ASC;

-- Contratos a expirar (próximos 60 dias)
CREATE OR REPLACE VIEW v_contratos_a_expirar AS
SELECT
  f.id,
  f.nombre,
  f.apellido1,
  f.nif,
  f.fecha_fin_contrato,
  f.tipo_contrato,
  (f.fecha_fin_contrato - CURRENT_DATE)::int AS dias_para_fim
FROM colaboradores f
WHERE f.estado = 'ativo'
  AND f.fecha_fin_contrato IS NOT NULL
  AND f.fecha_fin_contrato >= CURRENT_DATE
  AND f.fecha_fin_contrato <= CURRENT_DATE + INTERVAL '60 days'
  AND f.deleted_at IS NULL
ORDER BY f.fecha_fin_contrato ASC;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE exames_medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas_epi ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilizadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================
-- IMPORTANTE: as policies consultam `utilizadores` para saber o role.
-- Para evitar "infinite recursion detected in policy", a consulta é
-- feita dentro de funções SECURITY DEFINER (o RLS da tabela consultada
-- não é aplicado no interior da função).

-- Verifica se um utilizador (auth.uid()) tem um dos roles dados.
CREATE OR REPLACE FUNCTION public.utilizador_tem_role(
  uid uuid,
  roles role_utilizador[]
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.utilizadores
    WHERE user_id = uid
      AND role = ANY(roles)
      AND ativo = TRUE
  );
$$;

-- Devolve o colaborador_id ligado ao utilizador (para leitura do próprio).
CREATE OR REPLACE FUNCTION public.utilizador_colaborador_id(
  uid uuid
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT colaborador_id FROM public.utilizadores
  WHERE user_id = uid AND ativo = TRUE
  LIMIT 1;
$$;

-- ROLE: admin (acesso total)
CREATE POLICY "admin_all_colaboradores" ON colaboradores
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]));

CREATE POLICY "admin_all_contratos" ON contratos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]));

-- ROLE: rh (CRUD completo)
CREATE POLICY "rh_all_colaboradores" ON colaboradores
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "rh_all_contratos" ON contratos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "rh_all_exames" ON exames_medicos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "rh_all_documentos" ON documentos_colaborador
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

-- ROLE: encarregado (leitura dos seus subordinados — na prática leitura geral)
CREATE POLICY "encarregado_ler_colaboradores" ON colaboradores
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['encarregado','rh','admin']::role_utilizador[]));

-- ROLE: colaborador (só vê os seus próprios dados)
CREATE POLICY "colaborador_ler_proprio" ON colaboradores
  FOR SELECT TO authenticated
  USING (public.utilizador_colaborador_id(auth.uid()) = colaboradores.id);

-- ROLE: financeiro (sem acesso a dados pessoais sensíveis)
-- Nota: financeiro NÃO tem policy, então NÃO tem acesso ao módulo RH

-- ROLE: auditor (leitura de tudo)
CREATE POLICY "auditor_ler_colaboradores" ON colaboradores
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "auditor_ler_audit" ON audit_log
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor','admin']::role_utilizador[]));

-- Utilizadores: só admin pode gerir (a função SECURITY DEFINER evita recursão)
CREATE POLICY "utilizadores_admin_all" ON utilizadores
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]));

-- Utilizadores: cada um pode ler o próprio
CREATE POLICY "utilizadores_proprio" ON utilizadores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Departamentos: leitura para todos (dados não sensíveis)
CREATE POLICY "departamentos_ler" ON departamentos
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "departamentos_admin" ON departamentos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

-- ============================================================
-- STORAGE: buckets para fotos e documentos
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('fotos-colaboradores', 'fotos-colaboradores', false),
  ('documentos-colaboradores', 'documentos-colaboradores', false),
  ('contratos', 'contratos', false),
  ('exames-medicos', 'exames-medicos', false);

-- Policies de armazenamento
CREATE POLICY "rh_manage_fotos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'fotos-colaboradores'
    AND EXISTS (SELECT 1 FROM utilizadores WHERE user_id = auth.uid() AND role IN ('rh', 'admin') AND ativo = TRUE)
  );

CREATE POLICY "rh_manage_documentos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id IN ('documentos-colaboradores', 'contratos', 'exames-medicos')
    AND EXISTS (SELECT 1 FROM utilizadores WHERE user_id = auth.uid() AND role IN ('rh', 'admin') AND ativo = TRUE)
  );

-- Colaborador pode ler o seu próprio documento
CREATE POLICY "colaborador_ler_proprio_documento" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('documentos-colaboradores', 'exames-medicos')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- DADOS INICIAIS (seed)
-- ============================================================

-- Departamentos típicos de um matadouro
INSERT INTO departamentos (codigo, nombre, descripcion) VALUES
  ('SACRIF', 'Sacrificio', 'Sala de sacrificio de animales'),
  ('DESP', 'Despiece', 'Sala de despiece y clasificación'),
  ('CAM', 'Cámaras', 'Cámaras frigoríficas y almacenamiento'),
  ('EXP', 'Expedición', 'Preparación y expedición de pedidos'),
  ('MANT', 'Mantenimiento', 'Mantenimiento de instalaciones y maquinaria'),
  ('LIM', 'Limpieza', 'Limpieza y desinfección (L+D)'),
  ('ADM', 'Administración', 'Administración, RRHH y finanzas'),
  ('CAL', 'Calidad', 'Control de calidad y HACCP');

-- Salario Mínimo Interprofesional 2026 (valor de referência)
-- Atualizar anualmente!!
COMMENT ON TABLE colaboradores IS 'Salário base mínimo (SMI 2026 España): 1.134€/mês x 14 pag = 15.876€/ano';

-- ============================================================
-- FIM DA MIGRATION 0001
-- ============================================================
