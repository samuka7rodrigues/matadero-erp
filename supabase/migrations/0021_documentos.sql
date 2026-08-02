-- ============================================================
-- ERP Matadero — Documentos Anexos Genéricos (por registo)
-- Migration 0021
--
-- Cria a tabela:
--   documentos -> anexos ligados a um registo de qualquer módulo
--                 (faturas, nominas, epis, advertencias, avaliacoes,
--                  ferias, exames, alojamientos, ...)
-- + bucket de storage 'documentos' com policies.
-- ============================================================

DROP TABLE IF EXISTS documentos;

-- ============================================================
-- TABELA: documentos
-- ============================================================

CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidade TEXT NOT NULL,                -- módulo/entidade (ex.: faturas, nominas, epis...)
  entidade_id UUID NOT NULL,             -- id do registo ao qual o documento pertence
  categoria TEXT DEFAULT 'documento',    -- documento / certificado / informe / recibo / comprovativo / outro
  nombre TEXT NOT NULL,
  descricao TEXT,
  referencia TEXT,                       -- texto humano do registo (ex.: "Fatura #FT-001")
  archivo_url TEXT NOT NULL,
  archivo_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID,
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE documentos IS 'Anexos genéricos ligados a registos de vários módulos';

CREATE INDEX idx_documentos_entidade ON documentos(entidade, entidade_id);
CREATE INDEX idx_documentos_entidade_criado ON documentos(entidade, created_at DESC);
CREATE INDEX idx_documentos_criado ON documentos(created_at DESC);

-- ============================================================
-- TRIGGER: updated_at
-- ============================================================

CREATE TRIGGER trg_documentos_updated
BEFORE UPDATE ON documentos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Admin e RH: CRUD completo
CREATE POLICY "documentos_admin_rh_all" ON documentos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

-- Financeiro e Auditor: leitura
CREATE POLICY "documentos_financeiro_auditor_ler" ON documentos
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['financeiro','auditor']::role_utilizador[]));

-- ============================================================
-- STORAGE: bucket documentos
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Admin e RH: gerir ficheiros
CREATE POLICY "docs_admin_rh_manage" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'documentos'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[])
  )
  WITH CHECK (
    bucket_id = 'documentos'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[])
  );

-- Financeiro e Auditor: podem ler
CREATE POLICY "docs_financeiro_auditor_ler" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documentos'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['financeiro','auditor']::role_utilizador[])
  );

-- ============================================================
-- FIM DA MIGRATION 0021
-- ============================================================
