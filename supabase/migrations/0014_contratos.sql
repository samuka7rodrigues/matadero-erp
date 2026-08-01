-- ============================================================
-- ERP Matadero — Módulo Contratos
-- Migration 0014
--
-- Cria as tabelas:
--   contratos            -> contratos gerais (empresa, cliente, colaborador)
--   contratos_documentos -> documentos anexos de cada contrato
--   contratos_firmas     -> firmas / assinaturas de cada contrato
-- + bucket de storage 'contratos-documentos' com policies.
-- ============================================================

-- ============================================================
-- TABELA: contratos
-- ============================================================

DROP TABLE IF EXISTS contratos_documentos;
DROP TABLE IF EXISTS contratos_firmas;
DROP TABLE IF EXISTS contratos;

CREATE TABLE contratos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero TEXT NOT NULL UNIQUE,                  -- número do contrato (ex.: CT-2026-001)
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  renovaciones INTEGER DEFAULT 0,               -- nº de renovações
  renovacion_automatica BOOLEAN DEFAULT FALSE,
  estado TEXT DEFAULT 'borrador',               -- borrador / ativo / vencido / rescindido / anulado
  observacoes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE contratos IS 'Contratos gerais (empresa, cliente, colaborador)';

CREATE INDEX idx_contratos_empresa ON contratos(empresa_id);
CREATE INDEX idx_contratos_cliente ON contratos(cliente_id);
CREATE INDEX idx_contratos_colaborador ON contratos(colaborador_id);
CREATE INDEX idx_contratos_estado ON contratos(estado);
CREATE INDEX idx_contratos_numero ON contratos(numero);

-- ============================================================
-- TABELA: contratos_documentos
-- ============================================================

CREATE TABLE contratos_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  categoria TEXT DEFAULT 'contrato',            -- contrato / anexo / clausula / comprovativo / outro
  nombre TEXT NOT NULL,
  descripcion TEXT,
  archivo_url TEXT NOT NULL,
  archivo_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID,
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE contratos_documentos IS 'Documentos anexos de cada contrato';

CREATE INDEX idx_contratos_documentos_contrato ON contratos_documentos(contrato_id);
CREATE INDEX idx_contratos_documentos_uploaded ON contratos_documentos(uploaded_at DESC);

-- ============================================================
-- TABELA: contratos_firmas
-- ============================================================

CREATE TABLE contratos_firmas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,                           -- empresa / cliente / colaborador
  nombre TEXT NOT NULL,                         -- nome do signatário
  cargo TEXT,
  dni TEXT,
  data_firma DATE,
  estado TEXT DEFAULT 'pendente',               -- pendente / assinado
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE contratos_firmas IS 'Firmas/assinaturas de cada contrato';

CREATE INDEX idx_contratos_firmas_contrato ON contratos_firmas(contrato_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_firmas ENABLE ROW LEVEL SECURITY;

-- Admin e RH: CRUD completo
CREATE POLICY "contratos_admin_rh_all" ON contratos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "contratos_documentos_admin_rh_all" ON contratos_documentos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "contratos_firmas_admin_rh_all" ON contratos_firmas
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

-- Auditor: leitura
CREATE POLICY "contratos_auditor_ler" ON contratos
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "contratos_documentos_auditor_ler" ON contratos_documentos
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "contratos_firmas_auditor_ler" ON contratos_firmas
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

-- ============================================================
-- STORAGE: bucket contratos-documentos
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos-documentos', 'contratos-documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Admin e RH: gerir ficheiros
CREATE POLICY "contratos_admin_rh_manage_files" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'contratos-documentos'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[])
  )
  WITH CHECK (
    bucket_id = 'contratos-documentos'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[])
  );

-- Auditor: pode ler
CREATE POLICY "contratos_auditor_ler_files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contratos-documentos'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[])
  );

-- ============================================================
-- FIM DA MIGRATION 0014
-- ============================================================
