-- ============================================================
-- ERP Matadero — Funções de Utilidade
-- Migration 0002: Validações e helpers
-- ============================================================

-- ============================================================
-- VALIDAÇÃO DE NIF (8 dígitos + letra)
-- ============================================================

CREATE OR REPLACE FUNCTION validar_nif(p_nif TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_letters TEXT := 'TRWAGMYFPDXBNJZSQVHLCKE';
  v_number INTEGER;
  v_expected CHAR;
BEGIN
  -- NIF: 8 dígitos + 1 letra
  IF p_nif IS NULL OR NOT (p_nif ~ '^[0-9XYZ][0-9]{6,7}[A-Z]$') THEN
    RETURN FALSE;
  END IF;

  -- Converter para 8 dígitos (X→0, Y→1, Z→2)
  v_number := CASE
    WHEN substr(p_nif, 1, 1) = 'X' THEN 0
    WHEN substr(p_nif, 1, 1) = 'Y' THEN 1
    WHEN substr(p_nif, 1, 1) = 'Z' THEN 2
    ELSE substring(p_nif FROM 1 FOR 8)::INTEGER
  END;

  v_expected := substr(v_letters, (v_number % 23) + 1, 1);

  RETURN v_expected = substr(p_nif, -1, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- VALIDAÇÃO DE CIF (Código Identificación Fiscal)
-- ============================================================

CREATE OR REPLACE FUNCTION validar_cif(p_cif TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_letras_ini TEXT := 'ABCDEFGHJNPQRSUVW';
  v_letras_pos TEXT := 'ABEH';
  v_letras_eq  TEXT := '0123456789';
  v_num TEXT;
  v_letra_ini CHAR;
  v_num_cif INTEGER;
  v_digito_control INTEGER;
  v_suma INTEGER := 0;
  v_i INTEGER;
  v_aux INTEGER;
  v_digito INTEGER;
  v_letra CHAR;
BEGIN
  IF p_cif IS NULL OR NOT (p_cif ~ '^[A-HJNP-SUVW][0-9]{7}[A-J0-9]$') THEN
    RETURN FALSE;
  END IF;

  v_letra_ini := substr(p_cif, 1, 1);
  v_num := substr(p_cif, 2, 7);
  v_num_cif := substr(p_cif, 9, 1);

  -- Soma ímpares
  FOR v_i IN 1..7 LOOP
    v_aux := substring(v_num, v_i, 1)::INTEGER;
    IF v_i % 2 = 1 THEN
      v_suma := v_suma + v_aux;
    ELSE
      v_suma := v_suma + (v_aux * 2) % 10 + floor((v_aux * 2) / 10);
    END IF;
  END LOOP;

  v_digito_control := (10 - (v_suma % 10)) % 10;
  v_digito := substring(v_num, 8, 1)::INTEGER;
  v_letra := substr(p_cif, 9, 1);

  IF v_letra_ini IN ('A', 'B', 'E', 'H') THEN
    RETURN v_letra = v_letras_eq[v_digito_control + 1];
  ELSIF v_letra_ini IN ('K', 'P', 'Q', 'S', 'N', 'W') THEN
    RETURN v_letra = v_letras_pos[v_digito_control + 1];
  ELSE
    RETURN v_letra = v_letras_eq[v_digito_control + 1] OR v_letra = v_letras_pos[v_digito_control + 1];
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- CÁLCULO DE DIAS DE FÉRIAS
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_dias_ferias(
  p_funcionario_id UUID,
  p_ano INTEGER
)
RETURNS TABLE (
  dias_totais INTEGER,
  dias_gozados INTEGER,
  dias_pendentes INTEGER,
  dias_pendentes_verao INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH
  ano_atual AS (
    SELECT DATE (p_ano || '-01-01') AS inicio, DATE (p_ano || '-12-31') AS fim
  ),
  dias_totais_ano AS (
    SELECT 30 AS dias
  ),
  ferias_ano AS (
    SELECT
      COALESCE(SUM(CASE WHEN estado = 'aprovado' THEN (data_fim - data_inicio + 1) ELSE 0 END), 0) AS dias_gozados,
      COALESCE(SUM(CASE
        WHEN estado = 'aprovado' AND data_inicio BETWEEN DATE ((p_ano || '-06-01')::DATE) AND DATE ((p_ano || '-09-30')::DATE)
        THEN (LEAST(data_fim, DATE ((p_ano || '-09-30')::DATE)) - GREATEST(data_inicio, DATE ((p_ano || '-06-01')::DATE)) + 1)
        ELSE 0
      END), 0) AS dias_verao
    FROM ferias, ano_atual
    WHERE ferias.funcionario_id = p_funcionario_id
      AND EXTRACT(YEAR FROM data_inicio) = p_ano
  )
  SELECT
    (SELECT dias FROM dias_totais_ano)::INTEGER,
    (SELECT dias_gozados FROM ferias_ano)::INTEGER,
    ((SELECT dias FROM dias_totais_ano) - (SELECT dias_gozados FROM ferias_ano))::INTEGER,
    GREATEST(15 - (SELECT dias_verao FROM ferias_ano), 0)::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- CÁLCULO DE HORAS ENTRE MARCAÇÕES
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_horas_jornada(
  p_funcionario_id UUID,
  p_data DATE
)
RETURNS TABLE (
  horas_ordinarias NUMERIC,
  horas_extras NUMERIC,
  horas_noturnas NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH
  marcacoes_ordenadas AS (
    SELECT
      tipo,
      data_hora,
      LEAD(data_hora) OVER (ORDER BY data_hora) AS prox_data_hora
    FROM marcacoes_ponto
    WHERE funcionario_id = p_funcionario_id
      AND DATE(data_hora) = p_data
  ),
  pares AS (
    SELECT
      tipo,
      data_hora,
      prox_data_hora,
      EXTRACT(EPOCH FROM (prox_data_hora - data_hora)) / 3600.0 AS horas
    FROM marcacoes_ordenadas
    WHERE prox_data_hora IS NOT NULL
  ),
  analise AS (
    SELECT
      SUM(CASE
        WHEN tipo IN ('entrada', 'volta_almoco') THEN
          CASE WHEN horas <= 8 THEN horas ELSE 0 END
        ELSE 0
      END) AS horas_ordinarias,
      SUM(CASE
        WHEN tipo IN ('entrada', 'volta_almoco') THEN
          CASE WHEN horas > 8 THEN horas - 8 ELSE 0 END
        ELSE 0
      END) AS horas_extras,
      SUM(CASE
        WHEN EXTRACT(HOUR FROM data_hora) >= 22 OR EXTRACT(HOUR FROM data_hora) < 6 THEN horas
        ELSE 0
      END) AS horas_noturnas
    FROM pares
  )
  SELECT
    COALESCE(horas_ordinarias, 0)::NUMERIC,
    COALESCE(horas_extras, 0)::NUMERIC,
    COALESCE(horas_noturnas, 0)::NUMERIC
  FROM analise;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- TABELA: ferias (módulo de férias)
-- ============================================================

CREATE TYPE estado_ferias AS ENUM (
  'pendente',
  'aprovado',
  'rejeitado',
  'cancelado'
);

CREATE TABLE ferias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias INTEGER GENERATED ALWAYS AS (data_fim - data_inicio + 1) STORED,
  tipo TEXT DEFAULT 'vacaciones',  -- 'vacaciones', 'asuntos_propios', 'boda', etc.
  estado estado_ferias DEFAULT 'pendente',
  solicitado_em TIMESTAMPTZ DEFAULT NOW(),
  solicitado_por UUID REFERENCES auth.users(id),
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_datas_ferias CHECK (data_fim >= data_inicio)
);

CREATE INDEX idx_ferias_funcionario ON ferias(funcionario_id);
CREATE INDEX idx_ferias_estado ON ferias(estado);
CREATE INDEX idx_ferias_periodo ON ferias(data_inicio, data_fim);

ALTER TABLE ferias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ferias_all_rh" ON ferias
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM utilizadores WHERE user_id = auth.uid() AND role IN ('rh', 'admin', 'encarregado') AND ativo = TRUE)
  );

CREATE POLICY "ferias_proprio" ON ferias
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilizadores u
      WHERE u.user_id = auth.uid()
        AND u.funcionario_id = ferias.funcionario_id
        AND u.ativo = TRUE
    )
  );

CREATE POLICY "ferias_insert_proprio" ON ferias
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilizadores u
      WHERE u.user_id = auth.uid()
        AND u.funcionario_id = ferias.funcionario_id
        AND u.ativo = TRUE
    )
  );

-- ============================================================
-- TABELA: marcações de ponto (tabela base para o módulo Ponto)
-- ============================================================

CREATE TYPE tipo_marcacao AS ENUM (
  'entrada',
  'saida',
  'inicio_almoco',
  'volta_almoco',
  'saida_emergencia'
);

CREATE TABLE marcacoes_ponto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo tipo_marcacao NOT NULL,
  geolocalizacao POINT,             -- PostGIS opcional
  endereco_ip INET,
  dispositivo TEXT,
  user_agent TEXT,
  validada BOOLEAN DEFAULT TRUE,
  correcao BOOLEAN DEFAULT FALSE,
  corrigido_por UUID REFERENCES auth.users(id),
  corrigido_em TIMESTAMPTZ,
  motivo_correcao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marcacoes_funcionario_data ON marcacoes_ponto(funcionario_id, data_hora DESC);
CREATE INDEX idx_marcacoes_data ON marcacoes_ponto(DATE(data_hora));
CREATE INDEX idx_marcacoes_tipo ON marcacoes_ponto(tipo);

-- Constraint: evitar marcações duplicadas (min 60 segundos)
CREATE OR REPLACE FUNCTION check_marcacao_duplicada()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM marcacoes_ponto
    WHERE funcionario_id = NEW.funcionario_id
      AND ABS(EXTRACT(EPOCH FROM (data_hora - NEW.data_hora))) < 60
      AND tipo = NEW.tipo
  ) THEN
    RAISE EXCEPTION 'Já existe uma marcação similar há menos de 60 segundos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_marcacao_duplicada
  BEFORE INSERT ON marcacoes_ponto
  FOR EACH ROW EXECUTE FUNCTION check_marcacao_duplicada();

ALTER TABLE marcacoes_ponto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ponto_insert" ON marcacoes_ponto
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilizadores u
      WHERE u.user_id = auth.uid()
        AND u.funcionario_id = marcacoes_ponto.funcionario_id
        AND u.ativo = TRUE
    )
  );

CREATE POLICY "ponto_select" ON marcacoes_ponto
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilizadores u
      WHERE u.user_id = auth.uid()
        AND u.ativo = TRUE
        AND (u.role IN ('rh', 'admin', 'encarregado', 'auditor')
             OR u.funcionario_id = marcacoes_ponto.funcionario_id)
    )
  );

COMMENT ON TABLE marcacoes_ponto IS 'Marcações de ponto (RD 8/2019) — conservação mínima 4 anos';

-- ============================================================
-- TABELA: turnos
-- ============================================================

CREATE TYPE tipo_turno AS ENUM (
  'manha',
  'tarde',
  'noite',
  'misto',
  'rotativo'
);

CREATE TABLE turnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  tipo tipo_turno NOT NULL,
  Departamento_id UUID REFERENCES departamentos(id),
  puesto TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_horas_turno CHECK (hora_fim > hora_inicio),
  UNIQUE(funcionario_id, data)
);

CREATE INDEX idx_turnos_funcionario ON turnos(funcionario_id);
CREATE INDEX idx_turnos_data ON turnos(data);
CREATE INDEX idx_turnos_departamento ON turnos(departamento_id);

ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "turnos_all_rh" ON turnos
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM utilizadores WHERE user_id = auth.uid() AND role IN ('rh', 'admin', 'encarregado') AND ativo = TRUE)
  );

CREATE POLICY "turnos_select_proprio" ON turnos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilizadores u
      WHERE u.user_id = auth.uid()
        AND u.funcionario_id = turnos.funcionario_id
        AND u.ativo = TRUE
    )
  );

-- ============================================================
-- FIM DA MIGRATION 0002
-- ============================================================
