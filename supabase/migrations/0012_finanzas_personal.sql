-- ============================================================
-- ERP Matadero — Módulo Finanzas — Gestión Personal y Presupuestos
-- Migration 0012
--
-- Cria as tabelas:
--   presupuestos         -> orçamentos para clientes
--   presupuesto_itens    -> linhas de cada presupuesto
--   nominas              -> folhas de salário por colaborador/mês
--   horas_extras         -> horas extraordinárias
-- ============================================================

DROP TABLE IF EXISTS presupuesto_itens;
DROP TABLE IF EXISTS presupuestos;
DROP TABLE IF EXISTS nominas;
DROP TABLE IF EXISTS horas_extras;

-- ============================================================
-- TABELA: presupuestos
-- ============================================================

CREATE TABLE presupuestos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero TEXT NOT NULL UNIQUE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  validade DATE,
  estado TEXT DEFAULT 'enviado',             -- borrador / enviado / aceito / rechazado
  base_imponible NUMERIC(12,2) DEFAULT 0,
  iva NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_presupuesto_total CHECK (total >= 0)
);

COMMENT ON TABLE presupuestos IS 'Orçamentos/presupuestos para clientes';

CREATE INDEX idx_presupuestos_cliente ON presupuestos(cliente_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: presupuesto_itens
-- ============================================================

CREATE TABLE presupuesto_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade NUMERIC(10,2) NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  iva_pct NUMERIC(5,2) NOT NULL DEFAULT 21,
  importe NUMERIC(12,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_presupuesto_item_qtd CHECK (quantidade > 0),
  CONSTRAINT chk_presupuesto_item_preco CHECK (preco_unitario >= 0)
);

CREATE INDEX idx_presupuesto_itens_presupuesto ON presupuesto_itens(presupuesto_id);

-- ============================================================
-- TABELA: nominas
-- ============================================================

CREATE TABLE nominas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  salario_base NUMERIC(10,2) NOT NULL DEFAULT 0,
  horas_extra_importe NUMERIC(10,2) NOT NULL DEFAULT 0,
  complementos NUMERIC(10,2) NOT NULL DEFAULT 0,
  irpf NUMERIC(10,2) NOT NULL DEFAULT 0,             -- retenção IRPF
  seguranca_social NUMERIC(10,2) NOT NULL DEFAULT 0,
  outras_deducoes NUMERIC(10,2) NOT NULL DEFAULT 0,
  liquido NUMERIC(10,2) NOT NULL DEFAULT 0,
  estado TEXT DEFAULT 'calculada',                   -- calculada / pagada / anulada
  fecha_pago DATE,
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_nomina_mes CHECK (mes BETWEEN 1 AND 12),
  CONSTRAINT uq_nomina_colaborador_mes UNIQUE (colaborador_id, mes, ano)
);

COMMENT ON TABLE nominas IS 'Folhas de salário mensais por colaborador';

CREATE INDEX idx_nominas_colaborador ON nominas(colaborador_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_nominas_periodo ON nominas(ano, mes) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: horas_extras
-- ============================================================

CREATE TABLE horas_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  horas NUMERIC(5,2) NOT NULL,
  tipo TEXT DEFAULT 'normal',                        -- normal / festivo / nocturna
  valor_hora NUMERIC(10,2) NOT NULL DEFAULT 0,
  importe NUMERIC(10,2) NOT NULL DEFAULT 0,         -- horas * valor_hora
  estado TEXT DEFAULT 'registrada',                  -- registrada / pagada
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_horas_extras_horas CHECK (horas > 0)
);

COMMENT ON TABLE horas_extras IS 'Horas extraordinárias dos colaboradores';

CREATE INDEX idx_horas_extras_colaborador ON horas_extras(colaborador_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TRIGGERS: updated_at automático + audit
-- ============================================================

CREATE TRIGGER trg_presupuestos_updated
  BEFORE UPDATE ON presupuestos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_presupuesto_itens_updated
  BEFORE UPDATE ON presupuesto_itens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_nominas_updated
  BEFORE UPDATE ON nominas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_horas_extras_updated
  BEFORE UPDATE ON horas_extras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_audit_presupuestos
  AFTER INSERT OR UPDATE OR DELETE ON presupuestos
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_presupuesto_itens
  AFTER INSERT OR UPDATE OR DELETE ON presupuesto_itens
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_nominas
  AFTER INSERT OR UPDATE OR DELETE ON nominas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_horas_extras
  AFTER INSERT OR UPDATE OR DELETE ON horas_extras
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuesto_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominas ENABLE ROW LEVEL SECURITY;
ALTER TABLE horas_extras ENABLE ROW LEVEL SECURITY;

-- Presupuestos: admin/financeiro CRUD, auditor leitura
CREATE POLICY "presupuestos_admin_fin_all" ON presupuestos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]));

CREATE POLICY "presupuesto_itens_admin_fin_all" ON presupuesto_itens
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]));

CREATE POLICY "presupuestos_auditor_ler" ON presupuestos
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "presupuesto_itens_auditor_ler" ON presupuesto_itens
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

-- Nóminas e horas extras: admin/rh/financeiro CRUD, auditor leitura
CREATE POLICY "nominas_admin_rh_fin_all" ON nominas
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh','financeiro']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh','financeiro']::role_utilizador[]));

CREATE POLICY "horas_extras_admin_rh_fin_all" ON horas_extras
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh','financeiro']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh','financeiro']::role_utilizador[]));

CREATE POLICY "nominas_auditor_ler" ON nominas
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "horas_extras_auditor_ler" ON horas_extras
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

-- ============================================================
-- FIM DA MIGRATION 0012
-- ============================================================
