-- ============================================================
-- ERP Matadero — Configurações do sistema
-- Migration 0023
--
-- 1) tabela configuracoes (linha única, id = 1): parâmetros da
--    empresa, RH, finanças e alertas de expiração.
-- 2) tabela feriados: calendário de feriados.
--
-- Leitura: todos os autenticados (coerente com a 0022).
-- Escrita: admin nas configurações; admin/rh nos feriados.
-- ============================================================

-- ============================================================
-- 1) configuracoes (singleton)
-- ============================================================

CREATE TABLE IF NOT EXISTS configuracoes (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  nome_empresa TEXT DEFAULT 'Matadero',
  cif_nif TEXT DEFAULT '',
  moeda TEXT DEFAULT 'EUR',
  idioma_default TEXT DEFAULT 'pt-BR',
  smi_mensal NUMERIC(10,2) DEFAULT 1134.00,
  iva_default NUMERIC(5,2) DEFAULT 21.00,
  jornada_default TEXT DEFAULT 'completa',
  base_hora_extra NUMERIC(10,2) DEFAULT 10.00,
  dias_ferias_ano INTEGER DEFAULT 30,
  fatura_serie TEXT DEFAULT 'FAT',
  fatura_vencimento_dias INTEGER DEFAULT 30,
  cobro_vencimento_dias INTEGER DEFAULT 30,
  pago_vencimento_dias INTEGER DEFAULT 30,
  alerta_itv BOOLEAN DEFAULT TRUE,
  alerta_itv_dias INTEGER DEFAULT 30,
  alerta_seguro BOOLEAN DEFAULT TRUE,
  alerta_seguro_dias INTEGER DEFAULT 30,
  alerta_contrato BOOLEAN DEFAULT TRUE,
  alerta_contrato_dias INTEGER DEFAULT 60,
  alerta_alojamiento BOOLEAN DEFAULT TRUE,
  alerta_alojamiento_dias INTEGER DEFAULT 30,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

COMMENT ON TABLE configuracoes IS 'Parâmetros globais do ERP (linha única)';

INSERT INTO configuracoes (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "configuracoes_leitura_geral" ON configuracoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "configuracoes_admin_gerir" ON configuracoes
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]));

-- ============================================================
-- 2) feriados
-- ============================================================

CREATE TABLE IF NOT EXISTS feriados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL,
  nombre TEXT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_feriado_fecha UNIQUE (fecha)
);

COMMENT ON TABLE feriados IS 'Calendário de feriados';

ALTER TABLE feriados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feriados_leitura_geral" ON feriados
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "feriados_admin_rh_gerir" ON feriados
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

-- ============================================================
-- FIM DA MIGRATION 0023
-- ============================================================
