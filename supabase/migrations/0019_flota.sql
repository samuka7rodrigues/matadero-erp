-- ============================================================
-- ERP Matadero — Módulo Flota (veículos)
-- Migration 0019
--
-- Tabelas:
--   flota_vehiculos     -> veículos (matrícula, marca, modelo...)
--   flota_conductores   -> atribuição de condutor (colaborador) ao veículo
--   flota_itv           -> inspeções técnicas (ITV)
--   flota_seguros       -> seguros
--   flota_mantenimiento -> manutenções / reparações
--   flota_combustible   -> abastecimentos de combustível
--   flota_kilometraje   -> leituras de quilómetros
--   flota_multas        -> multas / sanções
--
-- Permissões (RLS):
--   - Admin/RH: gestão total
--   - Financeiro/Auditor: leitura
-- ============================================================

-- ============================================================
-- TABELA: flota_vehiculos
-- ============================================================

CREATE TABLE flota_vehiculos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricula TEXT NOT NULL UNIQUE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  tipo TEXT DEFAULT 'furgoneta',          -- coche / furgoneta / camion / moto / otro
  ano INTEGER,
  km_actuales INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'activo',           -- activo / en_taller / baja
  fecha_compra DATE,
  fecha_baja DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE flota_vehiculos IS 'Veículos da frota';

CREATE INDEX idx_flota_vehiculos_estado ON flota_vehiculos(estado);
CREATE INDEX idx_flota_vehiculos_tipo ON flota_vehiculos(tipo);

-- ============================================================
-- TABELA: flota_conductores
-- ============================================================

CREATE TABLE flota_conductores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehiculo_id UUID NOT NULL REFERENCES flota_vehiculos(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  asignado_desde DATE NOT NULL DEFAULT CURRENT_DATE,
  asignado_hasta DATE,
  principal BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (vehiculo_id, colaborador_id)
);

COMMENT ON TABLE flota_conductores IS 'Condutores atribuídos aos veículos';

CREATE INDEX idx_flota_conductores_vehiculo ON flota_conductores(vehiculo_id);
CREATE INDEX idx_flota_conductores_colaborador ON flota_conductores(colaborador_id);

-- ============================================================
-- TABELA: flota_itv
-- ============================================================

CREATE TABLE flota_itv (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehiculo_id UUID NOT NULL REFERENCES flota_vehiculos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  fecha_validez DATE,
  resultado TEXT DEFAULT 'pendiente',     -- pendiente / favorable / desfavorable / no_presentado
  centro TEXT,
  documento_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE flota_itv IS 'Inspeções técnicas (ITV) dos veículos';

CREATE INDEX idx_flota_itv_vehiculo ON flota_itv(vehiculo_id);
CREATE INDEX idx_flota_itv_validez ON flota_itv(fecha_validez) WHERE fecha_validez IS NOT NULL;

-- ============================================================
-- TABELA: flota_seguros
-- ============================================================

CREATE TABLE flota_seguros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehiculo_id UUID NOT NULL REFERENCES flota_vehiculos(id) ON DELETE CASCADE,
  compania TEXT NOT NULL,
  poliza TEXT,
  tipo TEXT DEFAULT 'todo_riesgo',        -- basico / terceros / todo_riesgo / otro
  fecha_inicio DATE,
  fecha_fin DATE,
  importe NUMERIC(10,2),
  estado TEXT DEFAULT 'activo',           -- activo / vencido / cancelado
  documento_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE flota_seguros IS 'Seguros dos veículos';

CREATE INDEX idx_flota_seguros_vehiculo ON flota_seguros(vehiculo_id);
CREATE INDEX idx_flota_seguros_fim ON flota_seguros(fecha_fin) WHERE fecha_fin IS NOT NULL;

-- ============================================================
-- TABELA: flota_mantenimiento
-- ============================================================

CREATE TABLE flota_mantenimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehiculo_id UUID NOT NULL REFERENCES flota_vehiculos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT DEFAULT 'preventivo',         -- correctivo / preventivo / neumaticos / frenos / revision / otro
  descricao TEXT NOT NULL,
  km INTEGER,
  importe NUMERIC(10,2),
  proveedor TEXT,
  factura_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE flota_mantenimiento IS 'Manutenções e reparações dos veículos';

CREATE INDEX idx_flota_mantenimiento_vehiculo ON flota_mantenimiento(vehiculo_id);
CREATE INDEX idx_flota_mantenimiento_fecha ON flota_mantenimiento(fecha);

-- ============================================================
-- TABELA: flota_combustible
-- ============================================================

CREATE TABLE flota_combustible (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehiculo_id UUID NOT NULL REFERENCES flota_vehiculos(id) ON DELETE CASCADE,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  litros NUMERIC(10,2) NOT NULL,
  importe NUMERIC(10,2) NOT NULL,
  km INTEGER,
  tipo TEXT DEFAULT 'diesel',             -- diesel / gasolina / electrico / otro
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE flota_combustible IS 'Abastecimentos de combustível';

CREATE INDEX idx_flota_combustible_vehiculo ON flota_combustible(vehiculo_id);
CREATE INDEX idx_flota_combustible_fecha ON flota_combustible(fecha);

-- ============================================================
-- TABELA: flota_kilometraje
-- ============================================================

CREATE TABLE flota_kilometraje (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehiculo_id UUID NOT NULL REFERENCES flota_vehiculos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  km INTEGER NOT NULL,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_flota_km CHECK (km >= 0)
);

COMMENT ON TABLE flota_kilometraje IS 'Registos de quilometragem';

CREATE INDEX idx_flota_kilometraje_vehiculo ON flota_kilometraje(vehiculo_id);

-- ============================================================
-- TABELA: flota_multas
-- ============================================================

CREATE TABLE flota_multas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehiculo_id UUID NOT NULL REFERENCES flota_vehiculos(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  importe NUMERIC(10,2) NOT NULL,
  descricao TEXT,
  lugar TEXT,
  estado TEXT DEFAULT 'pendiente',        -- pendiente / pagada / recurrida / anulada
  documento_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE flota_multas IS 'Multas e sanções de trânsito';

CREATE INDEX idx_flota_multas_vehiculo ON flota_multas(vehiculo_id);
CREATE INDEX idx_flota_multas_estado ON flota_multas(estado);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE flota_vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE flota_conductores ENABLE ROW LEVEL SECURITY;
ALTER TABLE flota_itv ENABLE ROW LEVEL SECURITY;
ALTER TABLE flota_seguros ENABLE ROW LEVEL SECURITY;
ALTER TABLE flota_mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE flota_combustible ENABLE ROW LEVEL SECURITY;
ALTER TABLE flota_kilometraje ENABLE ROW LEVEL SECURITY;
ALTER TABLE flota_multas ENABLE ROW LEVEL SECURITY;

-- Admin/RH: gestão total
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['flota_vehiculos','flota_conductores','flota_itv','flota_seguros','flota_mantenimiento','flota_combustible','flota_kilometraje','flota_multas']
  LOOP
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO authenticated USING (public.utilizador_tem_role(auth.uid(), ARRAY[''admin'',''rh'']::role_utilizador[])) WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY[''admin'',''rh'']::role_utilizador[]));', tbl || '_admin_rh_all', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (public.utilizador_tem_role(auth.uid(), ARRAY[''financeiro'',''auditor'']::role_utilizador[]));', tbl || '_financeiro_auditor_ler', tbl);
  END LOOP;
END $$;

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================

CREATE TRIGGER trg_flota_vehiculos_updated
  BEFORE UPDATE ON flota_vehiculos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_flota_conductores_updated
  BEFORE UPDATE ON flota_conductores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_flota_itv_updated
  BEFORE UPDATE ON flota_itv
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_flota_seguros_updated
  BEFORE UPDATE ON flota_seguros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_flota_mantenimiento_updated
  BEFORE UPDATE ON flota_mantenimiento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_flota_combustible_updated
  BEFORE UPDATE ON flota_combustible
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_flota_kilometraje_updated
  BEFORE UPDATE ON flota_kilometraje
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_flota_multas_updated
  BEFORE UPDATE ON flota_multas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FIM DA MIGRATION 0019
-- ============================================================
