-- ============================================================
-- ERP Matadero — Módulo Empresa (Cadastro de Empresa)
-- Migration 0008
--
-- Cria a tabela `empresas` (cadastro da empresa / grupo) com os
-- dados fiscais, contacto, banca e responsáveis, além de RLS e
-- um bucket de storage para logotipos.
-- ============================================================

-- ============================================================
-- TABELA: empresas
-- ============================================================

CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Identificação
  nombre TEXT NOT NULL,                     -- nombre de la empresa
  nombre_comercial TEXT,                    -- nombre comercial
  cif_nif TEXT UNIQUE,                      -- CIF / NIF
  iva NUMERIC(5,2) DEFAULT 21.00,           -- tipo IVA aplicable (%)

  -- Contacto
  direccion TEXT,
  ciudad TEXT,
  codigo_postal TEXT,
  pais TEXT DEFAULT 'ES',
  telefono TEXT,
  correo CITEXT,
  web TEXT,

  -- Logotipo
  logotipo_url TEXT,

  -- Banca
  banco TEXT,
  iban TEXT,
  swift TEXT,

  -- Responsáveis
  responsable_direccion TEXT,               -- Dirección
  responsable_rrhh TEXT,                    -- RRHH
  responsable_finanzas TEXT,                -- Finanzas
  responsable_operaciones TEXT,             -- Operaciones

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,                   -- soft delete

  CONSTRAINT chk_empresa_cp CHECK (codigo_postal IS NULL OR codigo_postal ~ '^[0-9]{4,5}$'),
  CONSTRAINT chk_empresa_iva CHECK (iva IS NULL OR (iva >= 0 AND iva <= 100)),
  CONSTRAINT chk_empresa_iban CHECK (iban IS NULL OR iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$'),
  CONSTRAINT chk_empresa_web CHECK (web IS NULL OR web ~ '^https?://')
);

COMMENT ON TABLE empresas IS 'Cadastro de empresas do grupo (dados fiscais, contacto, banca e responsáveis)';

CREATE INDEX idx_empresas_nombre ON empresas(nombre) WHERE deleted_at IS NULL;
CREATE INDEX idx_empresas_cif ON empresas(cif_nif);

-- ============================================================
-- TRIGGERS: updated_at automático + audit
-- ============================================================

CREATE TRIGGER trg_empresas_updated
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_audit_empresas
  AFTER INSERT OR UPDATE OR DELETE ON empresas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- Admin e RH: CRUD completo
CREATE POLICY "empresas_admin_all" ON empresas
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

-- Financeiro: leitura (dados da empresa para faturas/tesouraria)
CREATE POLICY "empresas_financeiro_ler" ON empresas
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['financeiro']::role_utilizador[]));

-- Auditor: leitura
CREATE POLICY "empresas_auditor_ler" ON empresas
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

-- ============================================================
-- STORAGE: bucket para logotipos
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos-empresa', 'logos-empresa', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "empresas_manage_logos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'logos-empresa'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[])
  )
  WITH CHECK (
    bucket_id = 'logos-empresa'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[])
  );

CREATE POLICY "empresas_ler_logos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'logos-empresa'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh','financeiro','auditor']::role_utilizador[])
  );

-- ============================================================
-- FIM DA MIGRATION 0008
-- ============================================================
