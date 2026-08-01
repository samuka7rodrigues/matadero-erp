-- ============================================================
-- ERP Matadero — Módulo RH ampliado
-- Migration 0015
--
-- Tabelas novas:
--   ausencias     -> ausências / baixas médicas / permisos
--   cursos        -> formação e cursos
--   certificados  -> certificados emitidos aos colaboradores
--   advertencias  -> sanções / advertências
--   avaliacoes    -> avaliações de desempenho e seguimento
--
-- + policies em falta para exames_medicos e entregas_epi
-- + bucket de storage 'rh-documentos'
-- ============================================================

-- ============================================================
-- TABELA: ausencias
-- ============================================================

CREATE TABLE ausencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'ausencia',          -- ausencia / baixa_medica / permiso / otra
  data_inicio DATE NOT NULL,
  data_fim DATE,
  dias INTEGER GENERATED ALWAYS AS (
    CASE WHEN data_fim IS NOT NULL THEN (data_fim - data_inicio + 1) END
  ) STORED,
  motivo TEXT,
  justificada BOOLEAN DEFAULT FALSE,
  justificante_url TEXT,
  estado TEXT DEFAULT 'pendiente',                -- pendiente / justificada / injustificada / cancelada
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_datas_ausencia CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

COMMENT ON TABLE ausencias IS 'Ausências, baixas médicas e permisos dos colaboradores';

CREATE INDEX idx_ausencias_colaborador ON ausencias(colaborador_id);
CREATE INDEX idx_ausencias_tipo ON ausencias(tipo);
CREATE INDEX idx_ausencias_data ON ausencias(data_inicio);
CREATE INDEX idx_ausencias_estado ON ausencias(estado);

-- ============================================================
-- TABELA: cursos
-- ============================================================

CREATE TABLE cursos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  entidad TEXT,
  horas NUMERIC(6,2),
  data_inicio DATE,
  data_fim DATE,
  estado TEXT DEFAULT 'programado',               -- programado / en_curso / completado / cancelado
  certificado_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_datas_curso CHECK (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio)
);

COMMENT ON TABLE cursos IS 'Cursos e formação dos colaboradores';

CREATE INDEX idx_cursos_colaborador ON cursos(colaborador_id);
CREATE INDEX idx_cursos_estado ON cursos(estado);

-- ============================================================
-- TABELA: certificados
-- ============================================================

CREATE TABLE certificados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  curso_id UUID REFERENCES cursos(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  entidad TEXT,
  tipo TEXT DEFAULT 'otro',                       -- formacion / seguridad / manipulacion / otro
  numero TEXT,
  data_emision DATE NOT NULL,
  data_validez DATE,
  documento_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_datas_certificado CHECK (data_validez IS NULL OR data_validez >= data_emision)
);

COMMENT ON TABLE certificados IS 'Certificados emitidos aos colaboradores';

CREATE INDEX idx_certificados_colaborador ON certificados(colaborador_id);
CREATE INDEX idx_certificados_validez ON certificados(data_validez) WHERE data_validez IS NOT NULL;

-- ============================================================
-- TABELA: advertencias
-- ============================================================

CREATE TABLE advertencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'escrita',           -- verbal / escrita
  gravidade TEXT DEFAULT 'leve',                  -- leve / grave / muy_grave
  motivo TEXT NOT NULL,
  data_advertencia DATE NOT NULL DEFAULT CURRENT_DATE,
  documento_url TEXT,
  estado TEXT DEFAULT 'abierta',                  -- abierta / cerrada
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE advertencias IS 'Advertências e sanções disciplinares';

CREATE INDEX idx_advertencias_colaborador ON advertencias(colaborador_id);
CREATE INDEX idx_advertencias_estado ON advertencias(estado);

-- ============================================================
-- TABELA: avaliacoes
-- ============================================================

CREATE TABLE avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo TEXT DEFAULT 'anual',                      -- inicial / seguimiento / anual / salida
  periodo TEXT,                                   -- ex.: '2026-Q1' ou '2026'
  data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
  pontuacao NUMERIC(4,2),                         -- 0 a 10
  resultados TEXT,
  objetivos TEXT,
  avaliador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_pontuacao CHECK (pontuacao IS NULL OR (pontuacao >= 0 AND pontuacao <= 10))
);

COMMENT ON TABLE avaliacoes IS 'Avaliações de desempenho e seguimento';

CREATE INDEX idx_avaliacoes_colaborador ON avaliacoes(colaborador_id);
CREATE INDEX idx_avaliacoes_data ON avaliacoes(data_avaliacao);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE ausencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

-- Admin e RH: CRUD completo
CREATE POLICY "ausencias_admin_rh_all" ON ausencias
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "cursos_admin_rh_all" ON cursos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "certificados_admin_rh_all" ON certificados
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "advertencias_admin_rh_all" ON advertencias
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "avaliacoes_admin_rh_all" ON avaliacoes
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

-- Encarregado: leitura (acompanha a sua equipa)
CREATE POLICY "ausencias_encarregado_ler" ON ausencias
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['encarregado']::role_utilizador[]));

CREATE POLICY "avaliacoes_encarregado_ler" ON avaliacoes
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['encarregado']::role_utilizador[]));

-- Auditor: leitura de tudo
CREATE POLICY "ausencias_auditor_ler" ON ausencias
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "cursos_auditor_ler" ON cursos
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "certificados_auditor_ler" ON certificados
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "advertencias_auditor_ler" ON advertencias
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "avaliacoes_auditor_ler" ON avaliacoes
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

-- Colaborador: lê os seus próprios registos
CREATE POLICY "ausencias_proprio" ON ausencias
  FOR SELECT TO authenticated
  USING (public.utilizador_colaborador_id(auth.uid()) = ausencias.colaborador_id);

CREATE POLICY "cursos_proprio" ON cursos
  FOR SELECT TO authenticated
  USING (public.utilizador_colaborador_id(auth.uid()) = cursos.colaborador_id);

CREATE POLICY "certificados_proprio" ON certificados
  FOR SELECT TO authenticated
  USING (public.utilizador_colaborador_id(auth.uid()) = certificados.colaborador_id);

CREATE POLICY "avaliacoes_proprio" ON avaliacoes
  FOR SELECT TO authenticated
  USING (public.utilizador_colaborador_id(auth.uid()) = avaliacoes.colaborador_id);

-- ============================================================
-- Policies em falta: exames_medicos e entregas_epi
-- ============================================================

-- Exames médicos: RH/Admin já tem CRUD (migration 0001). Faltam leitura p/ auditor e próprio.
CREATE POLICY "exames_auditor_ler" ON exames_medicos
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "exames_proprio" ON exames_medicos
  FOR SELECT TO authenticated
  USING (public.utilizador_colaborador_id(auth.uid()) = exames_medicos.colaborador_id);

-- Entregas EPI: não tinha policies — Admin/RH CRUD, auditor leitura, próprio leitura.
CREATE POLICY "epis_admin_rh_all" ON entregas_epi
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "epis_auditor_ler" ON entregas_epi
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "epis_proprio" ON entregas_epi
  FOR SELECT TO authenticated
  USING (public.utilizador_colaborador_id(auth.uid()) = entregas_epi.colaborador_id);

-- ============================================================
-- STORAGE: bucket rh-documentos
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('rh-documentos', 'rh-documentos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "rh_admin_manage_rh_documentos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'rh-documentos'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[])
  )
  WITH CHECK (
    bucket_id = 'rh-documentos'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[])
  );

CREATE POLICY "rh_auditor_ler_documentos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'rh-documentos'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[])
  );

-- ============================================================
-- TRIGGERS: updated_at para as novas tabelas
-- ============================================================

CREATE TRIGGER trg_ausencias_updated
  BEFORE UPDATE ON ausencias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_cursos_updated
  BEFORE UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_certificados_updated
  BEFORE UPDATE ON certificados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_advertencias_updated
  BEFORE UPDATE ON advertencias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_avaliacoes_updated
  BEFORE UPDATE ON avaliacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FIM DA MIGRATION 0015
-- ============================================================
