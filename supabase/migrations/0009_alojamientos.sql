-- ============================================================
-- ERP Matadero — Módulo Alojamientos (Viviendas)
-- Migration 0009 — FASE 1
--
-- Cria as tabelas:
--   alojamientos  -> viviendas/imóveis da empresa
--   habitaciones  -> quartos dentro de cada vivienda
--   ocupacion     -> ocupação de vivienda/habitación por colaborador
-- ============================================================

-- ============================================================
-- TABELA: alojamientos (viviendas)
-- ============================================================

CREATE TABLE alojamientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,  -- empresa a que pertence

  -- Identificação
  codigo TEXT,                          -- código interno (ex: VIV-001)
  nombre TEXT NOT NULL,                 -- nome / designação da vivienda
  tipo TEXT DEFAULT 'vivienda',         -- vivienda / piso / apartamento / residencia
  capacidad INTEGER,                    -- nº total de plazas

  -- Morada
  direccion TEXT,
  ciudad TEXT,
  codigo_postal TEXT,
  pais TEXT DEFAULT 'ES',

  -- Económico
  renda_mensal NUMERIC(10,2),           -- alquiler / renda mensal

  -- Gestão
  responsable TEXT,                     -- responsável / contacto
  estado TEXT DEFAULT 'ativo',          -- ativo / inativo
  observacoes TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,               -- soft delete

  CONSTRAINT chk_alojamiento_cp CHECK (codigo_postal IS NULL OR codigo_postal ~ '^[0-9]{4,5}$'),
  CONSTRAINT chk_alojamiento_capacidad CHECK (capacidad IS NULL OR capacidad > 0),
  CONSTRAINT chk_alojamiento_renda CHECK (renda_mensal IS NULL OR renda_mensal >= 0)
);

COMMENT ON TABLE alojamientos IS 'Viviendas/alojamientos da empresa para colaboradores';

CREATE INDEX idx_alojamientos_empresa ON alojamientos(empresa_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_alojamientos_nombre ON alojamientos(nombre) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: habitaciones
-- ============================================================

CREATE TABLE habitaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alojamiento_id UUID NOT NULL REFERENCES alojamientos(id) ON DELETE CASCADE,

  numero TEXT NOT NULL,                 -- ex: A-101
  nombre TEXT,                          -- opcional (ex: "Quarto do André")
  tipo TEXT DEFAULT 'compartida',       -- individual / compartida / matrimonial
  capacidad INTEGER DEFAULT 1,          -- nº de camas na habitación
  estado TEXT DEFAULT 'livre',          -- livre / ocupada / manutencao / fora_de_uso
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_habitacion_capacidad CHECK (capacidad > 0)
);

COMMENT ON TABLE habitaciones IS 'Quartos de cada vivienda';

CREATE INDEX idx_habitaciones_alojamiento ON habitaciones(alojamiento_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: ocupacion
-- ============================================================

CREATE TABLE ocupacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alojamiento_id UUID NOT NULL REFERENCES alojamientos(id) ON DELETE CASCADE,
  habitacion_id UUID REFERENCES habitaciones(id) ON DELETE SET NULL,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,

  data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  data_saida DATE,
  estado TEXT DEFAULT 'ativa',          -- ativa / concluida
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_ocupacion_datas CHECK (data_saida IS NULL OR data_saida >= data_entrada)
);

COMMENT ON TABLE ocupacion IS 'Ocupação de vivienda/habitación por colaborador';

CREATE INDEX idx_ocupacion_alojamiento ON ocupacion(alojamiento_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ocupacion_colaborador ON ocupacion(colaborador_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TRIGGERS: updated_at automático + audit
-- ============================================================

CREATE TRIGGER trg_alojamientos_updated
  BEFORE UPDATE ON alojamientos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_habitaciones_updated
  BEFORE UPDATE ON habitaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ocupacion_updated
  BEFORE UPDATE ON ocupacion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_audit_alojamientos
  AFTER INSERT OR UPDATE OR DELETE ON alojamientos
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_habitaciones
  AFTER INSERT OR UPDATE OR DELETE ON habitaciones
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_ocupacion
  AFTER INSERT OR UPDATE OR DELETE ON ocupacion
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE alojamientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocupacion ENABLE ROW LEVEL SECURITY;

-- Admin e RH: CRUD completo nas três tabelas
CREATE POLICY "alojamientos_admin_all" ON alojamientos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "habitaciones_admin_all" ON habitaciones
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "ocupacion_admin_all" ON ocupacion
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

-- Financeiro: leitura (custos de alojamento)
CREATE POLICY "alojamientos_financeiro_ler" ON alojamientos
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['financeiro']::role_utilizador[]));

CREATE POLICY "habitaciones_financeiro_ler" ON habitaciones
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['financeiro']::role_utilizador[]));

CREATE POLICY "ocupacion_financeiro_ler" ON ocupacion
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['financeiro']::role_utilizador[]));

-- Auditor: leitura
CREATE POLICY "alojamientos_auditor_ler" ON alojamientos
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "habitaciones_auditor_ler" ON habitaciones
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "ocupacion_auditor_ler" ON ocupacion
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

-- ============================================================
-- FIM DA MIGRATION 0009
-- ============================================================
