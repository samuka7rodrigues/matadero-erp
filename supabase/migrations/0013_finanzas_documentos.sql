-- ============================================================
-- ERP Matadero — Módulo Finanzas — Documentos Anexos Globais
-- Migration 0013
--
-- Cria a tabela:
--   documentos_finanzas  -> anexos globais do módulo Finanzas
-- + bucket de storage 'documentos-finanzas' com policies.
-- ============================================================

DROP TABLE IF EXISTS documentos_finanzas;

-- ============================================================
-- TABELA: documentos_finanzas
-- ============================================================

CREATE TABLE documentos_finanzas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria TEXT DEFAULT 'outro',              -- fatura / recibo / contrato / comprovativo / outro
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

COMMENT ON TABLE documentos_finanzas IS 'Anexos globais do módulo Finanzas (faturas, recibos, contratos, comprovativos...)';

CREATE INDEX idx_documentos_finanzas_categoria ON documentos_finanzas(categoria);
CREATE INDEX idx_documentos_finanzas_uploaded ON documentos_finanzas(uploaded_at DESC);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE documentos_finanzas ENABLE ROW LEVEL SECURITY;

-- Admin e Financeiro: CRUD completo
CREATE POLICY "documentos_finanzas_admin_fin_all" ON documentos_finanzas
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]));

-- Auditor: leitura
CREATE POLICY "documentos_finanzas_auditor_ler" ON documentos_finanzas
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

-- ============================================================
-- STORAGE: bucket documentos-finanzas
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-finanzas', 'documentos-finanzas', false)
ON CONFLICT (id) DO NOTHING;

-- Admin e Financeiro: gerir ficheiros
CREATE POLICY "fin_admin_manage_documentos_finanzas" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'documentos-finanzas'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[])
  )
  WITH CHECK (
    bucket_id = 'documentos-finanzas'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[])
  );

-- Auditor: pode ler
CREATE POLICY "fin_auditor_ler_documentos_finanzas" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documentos-finanzas'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[])
  );

-- ============================================================
-- FIM DA MIGRATION 0013
-- ============================================================
