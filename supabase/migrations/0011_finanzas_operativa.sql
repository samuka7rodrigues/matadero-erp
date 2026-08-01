-- ============================================================
-- ERP Matadero — Módulo Finanzas — Operativa Financiera
-- Migration 0011
--
-- Cria as tabelas:
--   clientes        -> cadastro de clientes
--   faturas         -> facturación emitida
--   fatura_itens    -> linhas de cada fatura
--   cobros          -> cobranças/entradas de caixa
--   pagos           -> pagamentos/saídas de caixa
--   despesas        -> costes da empresa
-- + vistas de flujo de caja e rentabilidad por cliente.
-- ============================================================

DROP VIEW IF EXISTS v_flujo_caja;
DROP VIEW IF EXISTS v_rentabilidad_cliente;

DROP TABLE IF EXISTS fatura_itens;
DROP TABLE IF EXISTS cobros;
DROP TABLE IF EXISTS faturas;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS despesas;
DROP TABLE IF EXISTS clientes;

-- ============================================================
-- TABELA: clientes
-- ============================================================

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  cif_nif TEXT,
  email CITEXT,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  codigo_postal TEXT,
  pais TEXT DEFAULT 'ES',
  estado TEXT DEFAULT 'ativo',             -- ativo / inativo
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_cliente_cp CHECK (codigo_postal IS NULL OR codigo_postal ~ '^[0-9]{4,5}$')
);

COMMENT ON TABLE clientes IS 'Cadastro de clientes para facturación e rentabilidad';

CREATE INDEX idx_clientes_nombre ON clientes(nombre) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: faturas
-- ============================================================

CREATE TABLE faturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero TEXT NOT NULL UNIQUE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,

  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  estado TEXT DEFAULT 'borrador',          -- borrador / emitida / pagada / anulada
  base_imponible NUMERIC(12,2) DEFAULT 0,
  iva NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_fatura_total CHECK (total >= 0),
  CONSTRAINT chk_fatura_vencimento CHECK (fecha_vencimiento IS NULL OR fecha_vencimiento >= fecha_emision)
);

COMMENT ON TABLE faturas IS 'Facturas emitidas a clientes';

CREATE INDEX idx_faturas_cliente ON faturas(cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_faturas_estado ON faturas(estado) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: fatura_itens
-- ============================================================

CREATE TABLE fatura_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fatura_id UUID NOT NULL REFERENCES faturas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade NUMERIC(10,2) NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  iva_pct NUMERIC(5,2) NOT NULL DEFAULT 21,
  importe NUMERIC(12,2) NOT NULL DEFAULT 0,    -- quantidade * preco_unitario (sem IVA)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_fatura_item_qtd CHECK (quantidade > 0),
  CONSTRAINT chk_fatura_item_preco CHECK (preco_unitario >= 0)
);

CREATE INDEX idx_fatura_itens_fatura ON fatura_itens(fatura_id);

-- ============================================================
-- TABELA: cobros
-- ============================================================

CREATE TABLE cobros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fatura_id UUID NOT NULL REFERENCES faturas(id) ON DELETE RESTRICT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  importe NUMERIC(12,2) NOT NULL,
  metodo_pago TEXT DEFAULT 'transferencia',    -- transferencia / efectivo / tarjeta / cheque / otros
  referencia TEXT,
  estado TEXT DEFAULT 'registrado',            -- registrado / anulado
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_cobro_importe CHECK (importe >= 0)
);

COMMENT ON TABLE cobros IS 'Cobranças/entradas de caixa associadas a faturas';

CREATE INDEX idx_cobros_fatura ON cobros(fatura_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: pagos
-- ============================================================

CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  concepto TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  importe NUMERIC(12,2) NOT NULL,
  categoria TEXT DEFAULT 'proveedor',          -- operacional / nomina / proveedor / impuestos / otros
  metodo_pago TEXT DEFAULT 'transferencia',
  referencia TEXT,
  estado TEXT DEFAULT 'registrado',            -- registrado / anulado
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_pago_importe CHECK (importe >= 0)
);

COMMENT ON TABLE pagos IS 'Pagamentos/saídas de caixa da empresa';

CREATE INDEX idx_pagos_data ON pagos(data) WHERE deleted_at IS NULL;

-- ============================================================
-- TABELA: despesas
-- ============================================================

CREATE TABLE despesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,  -- custo atribuído a cliente
  categoria TEXT DEFAULT 'servicios',          -- servicios / compra_materias / alquileres / personal / otros
  concepto TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  importe NUMERIC(12,2) NOT NULL,
  iva NUMERIC(12,2) DEFAULT 0,
  fornecedor TEXT,
  forma_pago TEXT DEFAULT 'transferencia',
  estado TEXT DEFAULT 'registrado',            -- registrado / anulado
  observacoes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_despesa_importe CHECK (importe >= 0)
);

COMMENT ON TABLE despesas IS 'Costes/despesas da empresa (por categoria)';

CREATE INDEX idx_despesas_categoria ON despesas(categoria) WHERE deleted_at IS NULL;
CREATE INDEX idx_despesas_cliente ON despesas(cliente_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TRIGGERS: updated_at automático + audit
-- ============================================================

CREATE TRIGGER trg_clientes_updated
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_faturas_updated
  BEFORE UPDATE ON faturas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_fatura_itens_updated
  BEFORE UPDATE ON fatura_itens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_cobros_updated
  BEFORE UPDATE ON cobros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pagos_updated
  BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_despesas_updated
  BEFORE UPDATE ON despesas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_audit_clientes
  AFTER INSERT OR UPDATE OR DELETE ON clientes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_faturas
  AFTER INSERT OR UPDATE OR DELETE ON faturas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_fatura_itens
  AFTER INSERT OR UPDATE OR DELETE ON fatura_itens
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_cobros
  AFTER INSERT OR UPDATE OR DELETE ON cobros
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_pagos
  AFTER INSERT OR UPDATE OR DELETE ON pagos
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_despesas
  AFTER INSERT OR UPDATE OR DELETE ON despesas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatura_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobros ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;

-- Admin e Financeiro: CRUD completo
CREATE POLICY "clientes_admin_fin_all" ON clientes
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]));

CREATE POLICY "faturas_admin_fin_all" ON faturas
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]));

CREATE POLICY "fatura_itens_admin_fin_all" ON fatura_itens
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]));

CREATE POLICY "cobros_admin_fin_all" ON cobros
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]));

CREATE POLICY "pagos_admin_fin_all" ON pagos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]));

CREATE POLICY "despesas_admin_fin_all" ON despesas
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','financeiro']::role_utilizador[]));

-- Auditor: leitura
CREATE POLICY "clientes_auditor_ler" ON clientes
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "faturas_auditor_ler" ON faturas
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "fatura_itens_auditor_ler" ON fatura_itens
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "cobros_auditor_ler" ON cobros
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "pagos_auditor_ler" ON pagos
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "despesas_auditor_ler" ON despesas
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

-- ============================================================
-- VISTAS: flujo de caja y rentabilidad por cliente
-- ============================================================

CREATE VIEW v_flujo_caja WITH (security_invoker = true) AS
SELECT
  e.data,
  e.tipo,                                   -- entrada / salida
  e.concepto,
  e.importe,
  e.referencia
FROM (
  SELECT c.data, 'entrada' AS tipo, ('Cobro · ' || COALESCE(f.numero, '')) AS concepto, c.importe, c.referencia
  FROM cobros c
  LEFT JOIN faturas f ON f.id = c.fatura_id
  WHERE c.deleted_at IS NULL AND c.estado = 'registrado'
  UNION ALL
  SELECT p.data, 'salida' AS tipo, ('Pago · ' || p.concepto) AS concepto, p.importe, p.referencia
  FROM pagos p
  WHERE p.deleted_at IS NULL AND p.estado = 'registrado'
  UNION ALL
  SELECT d.data, 'salida' AS tipo, ('Despesa · ' || d.concepto) AS concepto, d.importe, NULL
  FROM despesas d
  WHERE d.deleted_at IS NULL AND d.estado = 'registrado'
) e
ORDER BY e.data DESC;

COMMENT ON VIEW v_flujo_caja IS 'Fluxo de caixa: entradas (cobros) e saídas (pagos e despesas)';

CREATE VIEW v_rentabilidad_cliente WITH (security_invoker = true) AS
SELECT
  c.id AS cliente_id,
  c.nombre AS cliente,
  COALESCE(f.total, 0) AS facturado,
  COALESCE(cob.total, 0) AS cobrado,
  COALESCE(d.total, 0) AS costes,
  COALESCE(f.total, 0) - COALESCE(d.total, 0) AS beneficio
FROM clientes c
LEFT JOIN (
  SELECT cliente_id, SUM(total) AS total
  FROM faturas
  WHERE deleted_at IS NULL AND estado <> 'anulada'
  GROUP BY cliente_id
) f ON f.cliente_id = c.id
LEFT JOIN (
  SELECT fa.cliente_id, SUM(cb.importe) AS total
  FROM cobros cb
  JOIN faturas fa ON fa.id = cb.fatura_id
  WHERE cb.deleted_at IS NULL AND cb.estado = 'registrado'
  GROUP BY fa.cliente_id
) cob ON cob.cliente_id = c.id
LEFT JOIN (
  SELECT cliente_id, SUM(importe) AS total
  FROM despesas
  WHERE deleted_at IS NULL AND estado = 'registrado' AND cliente_id IS NOT NULL
  GROUP BY cliente_id
) d ON d.cliente_id = c.id
WHERE c.deleted_at IS NULL
ORDER BY beneficio DESC;

COMMENT ON VIEW v_rentabilidad_cliente IS 'Rentabilidad por cliente: facturado, cobrado, costes e beneficio';

-- ============================================================
-- FIM DA MIGRATION 0011
-- ============================================================
