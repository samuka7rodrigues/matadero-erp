-- ============================================================
-- ERP Matadero — Módulo Alojamientos — FASE 2
-- Migration 0010
--
-- Cria as tabelas:
--   inventario   -> itens/mobiliário de cada vivienda/habitación
--   fotografias  -> fotos das viviendas/habitaciones (storage)
--   incidencias  -> incidências (manutenção, limpeza, outras)
--   contratos    -> contratos de arrendamento por colaborador
--   consumos     -> consumos de água/luz/gás
-- Além do bucket de storage para fotografias e RLS.
-- ============================================================

-- Guards de re-execução (a primeira tentativa pode ter ficado a meio)
DROP TABLE IF EXISTS inventario;
DROP TABLE IF EXISTS fotografias;
DROP TABLE IF EXISTS incidencias;
DROP TABLE IF EXISTS contratos_arrendamento;
DROP TABLE IF EXISTS consumos;

-- ============================================================
-- TABELA: inventario
-- ============================================================

CREATE TABLE inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alojamiento_id UUID NOT NULL REFERENCES alojamientos(id) ON DELETE CASCADE,
  habitacion_id UUID REFERENCES habitaciones(id) ON DELETE SET NULL,

  nombre TEXT NOT NULL,
  categoria TEXT DEFAULT 'mobiliario',     -- mobiliario / electrodomestico / ropa_cama / otra
  quantidade INTEGER DEFAULT 1,
  estado TEXT DEFAULT 'bom',               -- novo / bom / desgastado / danificado
  valor NUMERIC(10,2),                     -- valor unitário estimado
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_inventario_qtd CHECK (quantidade > 0),
  CONSTRAINT chk_inventario_valor CHECK (valor IS NULL OR valor >= 0)
);

COMMENT ON TABLE inventario IS 'Inventário de mobiliário/equipamentos das viviendas';

CREATE INDEX idx_inventario_alojamiento ON inventario(alojamiento_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: fotografias
-- ============================================================

CREATE TABLE fotografias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alojamiento_id UUID NOT NULL REFERENCES alojamientos(id) ON DELETE CASCADE,
  habitacion_id UUID REFERENCES habitaciones(id) ON DELETE SET NULL,

  url TEXT NOT NULL,                       -- caminho no bucket de storage
  descripcion TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE fotografias IS 'Fotografias das viviendas/habitaciones';

CREATE INDEX idx_fotografias_alojamiento ON fotografias(alojamiento_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: incidencias
-- ============================================================

CREATE TABLE incidencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alojamiento_id UUID NOT NULL REFERENCES alojamientos(id) ON DELETE CASCADE,
  habitacion_id UUID REFERENCES habitaciones(id) ON DELETE SET NULL,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,  -- quem reportou

  tipo TEXT DEFAULT 'mantenimiento',       -- mantenimiento / limpieza / otra
  descripcion TEXT NOT NULL,
  prioridad TEXT DEFAULT 'media',          -- baja / media / alta
  estado TEXT DEFAULT 'abierta',           -- abierta / en_proceso / resuelta
  fecha TIMESTAMPTZ DEFAULT NOW(),
  fecha_resolucion TIMESTAMPTZ,
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE incidencias IS 'Incidências reportadas nas viviendas/habitaciones';

CREATE INDEX idx_incidencias_alojamiento ON incidencias(alojamiento_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: contratos
-- ============================================================

CREATE TABLE contratos_arrendamento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT,
  alojamiento_id UUID NOT NULL REFERENCES alojamientos(id) ON DELETE CASCADE,
  habitacion_id UUID REFERENCES habitaciones(id) ON DELETE SET NULL,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,  -- titular

  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  renda NUMERIC(10,2),                     -- renda mensal contratada
  estado TEXT DEFAULT 'ativo',             -- ativo / vencido / rescindido
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_contrato_renda CHECK (renda IS NULL OR renda >= 0),
  CONSTRAINT chk_contrato_datas CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

COMMENT ON TABLE contratos_arrendamento IS 'Contratos de arrendamento de viviendas/habitaciones a colaboradores';

CREATE INDEX idx_contratos_arrendamiento_alojamiento ON contratos_arrendamento(alojamiento_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contratos_arrendamiento_colaborador ON contratos_arrendamento(colaborador_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: consumos
-- ============================================================

CREATE TABLE consumos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alojamiento_id UUID NOT NULL REFERENCES alojamientos(id) ON DELETE CASCADE,

  tipo TEXT DEFAULT 'agua',                -- agua / luz / gas / otros
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  leitura_anterior NUMERIC(12,2),
  leitura_atual NUMERIC(12,2),
  importe NUMERIC(10,2),                   -- custo do período
  fornecedor TEXT,
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_consumo_importe CHECK (importe IS NULL OR importe >= 0),
  CONSTRAINT chk_consumo_leitura CHECK (
    leitura_atual IS NULL OR leitura_anterior IS NULL OR leitura_atual >= leitura_anterior
  )
);

COMMENT ON TABLE consumos IS 'Consumos de serviços (água, luz, gás) das viviendas';

CREATE INDEX idx_consumos_alojamiento ON consumos(alojamiento_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TRIGGERS: updated_at automático + audit
-- ============================================================

CREATE TRIGGER trg_inventario_updated
  BEFORE UPDATE ON inventario
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_fotografias_updated
  BEFORE UPDATE ON fotografias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_incidencias_updated
  BEFORE UPDATE ON incidencias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_contratos_arrendamiento_updated
  BEFORE UPDATE ON contratos_arrendamento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_consumos_updated
  BEFORE UPDATE ON consumos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_audit_inventario
  AFTER INSERT OR UPDATE OR DELETE ON inventario
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_fotografias
  AFTER INSERT OR UPDATE OR DELETE ON fotografias
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_incidencias
  AFTER INSERT OR UPDATE OR DELETE ON incidencias
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_contratos_arrendamiento
  AFTER INSERT OR UPDATE OR DELETE ON contratos_arrendamento
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_consumos
  AFTER INSERT OR UPDATE OR DELETE ON consumos
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotografias ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos_arrendamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumos ENABLE ROW LEVEL SECURITY;

-- Admin e RH: CRUD completo
CREATE POLICY "inventario_admin_all" ON inventario
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "fotografias_admin_all" ON fotografias
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "incidencias_admin_all" ON incidencias
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "contratos_arrendamiento_admin_all" ON contratos_arrendamento
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "consumos_admin_all" ON consumos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

-- Financeiro: leitura (custos e contratos)
CREATE POLICY "inventario_financeiro_ler" ON inventario
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['financeiro']::role_utilizador[]));

CREATE POLICY "fotografias_financeiro_ler" ON fotografias
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['financeiro']::role_utilizador[]));

CREATE POLICY "incidencias_financeiro_ler" ON incidencias
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['financeiro']::role_utilizador[]));

CREATE POLICY "contratos_arrendamiento_financeiro_ler" ON contratos_arrendamento
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['financeiro']::role_utilizador[]));

CREATE POLICY "consumos_financeiro_ler" ON consumos
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['financeiro']::role_utilizador[]));

-- Auditor: leitura
CREATE POLICY "inventario_auditor_ler" ON inventario
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "fotografias_auditor_ler" ON fotografias
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "incidencias_auditor_ler" ON incidencias
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "contratos_arrendamiento_auditor_ler" ON contratos_arrendamento
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "consumos_auditor_ler" ON consumos
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

-- ============================================================
-- STORAGE: bucket para fotografias
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('fotografias-alojamento', 'fotografias-alojamento', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "alojamiento_manage_fotos" ON storage.objects;
DROP POLICY IF EXISTS "alojamiento_ler_fotos" ON storage.objects;

CREATE POLICY "alojamiento_manage_fotos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'fotografias-alojamento'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[])
  )
  WITH CHECK (
    bucket_id = 'fotografias-alojamento'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[])
  );

CREATE POLICY "alojamiento_ler_fotos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'fotografias-alojamento'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh','financeiro','auditor']::role_utilizador[])
  );

-- ============================================================
-- FIM DA MIGRATION 0010
-- ============================================================
