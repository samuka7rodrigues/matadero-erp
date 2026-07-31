-- ============================================================
-- ERP Matadero — Renomeação "funcionario(s)" -> "colaborador(es)"
-- Migration 0004
--
-- Converte bases de dados já criadas com os nomes antigos
-- (tabela `funcionarios`, coluna `funcionario_id`, role 'funcionario',
-- políticas / funções / índices / constraints com "funcionario",
-- buckets de storage 'fotos-funcionarios' / 'documentos-funcionarios').
--
-- NOTA: as migrations 0001-0003 já foram atualizadas para os nomes
-- novos, pelo que num reset limpo (db reset) esta migration é um
-- no-op seguro. Só faz trabalho em BDs que tenham os nomes antigos.
-- ============================================================

-- ============================================================
-- 1. TIPOS E VALORES DE ENUM
-- ============================================================

-- estado_funcionario -> estado_colaborador
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    WHERE t.typname = 'estado_funcionario'
      AND t.typnamespace = 'public'::regnamespace
  ) THEN
    ALTER TYPE estado_funcionario RENAME TO estado_colaborador;
  END IF;
END $$;

-- role_utilizador: valor 'funcionario' -> 'colaborador'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'role_utilizador'
      AND e.enumlabel = 'funcionario'
  ) THEN
    ALTER TYPE role_utilizador RENAME VALUE 'funcionario' TO 'colaborador';
  END IF;
END $$;

-- ============================================================
-- 2. TABELAS
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.funcionarios') IS NOT NULL THEN
    ALTER TABLE public.funcionarios RENAME TO colaboradores;
  END IF;
  IF to_regclass('public.documentos_funcionario') IS NOT NULL THEN
    ALTER TABLE public.documentos_funcionario RENAME TO documentos_colaborador;
  END IF;
END $$;

-- ============================================================
-- 3. COLUNAS: funcionario_id -> colaborador_id
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name IN ('contratos','documentos_colaborador','exames_medicos',
                         'entregas_epi','utilizadores','ferias','marcacoes_ponto','turnos')
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = r.table_name
        AND column_name = 'funcionario_id'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I RENAME COLUMN funcionario_id TO colaborador_id',
        r.table_name
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 4. FUNÇÕES
-- ============================================================

-- utilizador_funcionario_id -> utilizador_colaborador_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'utilizador_funcionario_id'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.utilizador_funcionario_id(uuid)
      RENAME TO utilizador_colaborador_id;
  END IF;
END $$;

-- Re-cria calcular_dias_ferias com parâmetro p_colaborador_id
DO $$
DECLARE
  v_old boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'calcular_dias_ferias'
      AND 'p_funcionario_id' = ANY(proargnames)
  ) INTO v_old;
  IF v_old THEN
    DROP FUNCTION public.calcular_dias_ferias(uuid, integer);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calcular_dias_ferias(
  p_colaborador_id UUID,
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
    WHERE ferias.colaborador_id = p_colaborador_id
      AND EXTRACT(YEAR FROM data_inicio) = p_ano
  )
  SELECT
    (SELECT dias FROM dias_totais_ano)::INTEGER,
    (SELECT fa.dias_gozados FROM ferias_ano fa)::INTEGER,
    ((SELECT dias FROM dias_totais_ano) - (SELECT fa.dias_gozados FROM ferias_ano fa))::INTEGER,
    GREATEST(15 - (SELECT fa.dias_verao FROM ferias_ano fa), 0)::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- Re-cria calcular_horas_jornada com parâmetro p_colaborador_id
-- (versão 0003: timezone Europe/Madrid no cálculo de horas)
DO $$
DECLARE
  v_old boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'calcular_horas_jornada'
      AND 'p_funcionario_id' = ANY(proargnames)
  ) INTO v_old;
  IF v_old THEN
    DROP FUNCTION public.calcular_horas_jornada(uuid, date);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calcular_horas_jornada(
  p_colaborador_id UUID,
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
    WHERE colaborador_id = p_colaborador_id
      AND ((data_hora AT TIME ZONE 'Europe/Madrid')::date) = p_data
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
        WHEN EXTRACT(HOUR FROM (data_hora AT TIME ZONE 'Europe/Madrid')) >= 22
          OR EXTRACT(HOUR FROM (data_hora AT TIME ZONE 'Europe/Madrid')) < 6
          THEN horas
        ELSE 0
      END) AS horas_noturnas
    FROM pares
  )
  SELECT
    COALESCE(a.horas_ordinarias, 0)::NUMERIC,
    COALESCE(a.horas_extras, 0)::NUMERIC,
    COALESCE(a.horas_noturnas, 0)::NUMERIC
  FROM analise a;
END;
$$ LANGUAGE plpgsql STABLE;

-- Re-cria trigger function check_marcacao_duplicada (usa colaborador_id)
CREATE OR REPLACE FUNCTION public.check_marcacao_duplicada()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM marcacoes_ponto
    WHERE colaborador_id = NEW.colaborador_id
      AND ABS(EXTRACT(EPOCH FROM (data_hora - NEW.data_hora))) < 60
      AND tipo = NEW.tipo
  ) THEN
    RAISE EXCEPTION 'Já existe uma marcação similar há menos de 60 segundos';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. CONSTRAINTS (renomear as que contêm "funcionario")
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname, c.conrelid::regclass AS tbl
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname LIKE '%funcionario%'
      AND n.nspname = 'public'
  LOOP
    EXECUTE format(
      'ALTER TABLE %s RENAME CONSTRAINT %I TO %I',
      r.tbl, r.conname, replace(r.conname, 'funcionario', 'colaborador')
    );
  END LOOP;
END $$;

-- ============================================================
-- 6. ÍNDICES (renomear os que contêm "funcionario",
--    excluindo os que pertencem a constraints — já tratadas)
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('i', 'I')
      AND c.relname LIKE '%funcionario%'
      AND n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_constraint cc WHERE cc.conindid = c.oid
      )
  LOOP
    EXECUTE format(
      'ALTER INDEX %I RENAME TO %I',
      r.relname, replace(r.relname, 'funcionario', 'colaborador')
    );
  END LOOP;
END $$;

-- ============================================================
-- 7. TRIGGERS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_funcionarios_updated'
      AND tgrelid = 'colaboradores'::regclass
  ) THEN
    ALTER TRIGGER trg_funcionarios_updated ON colaboradores
      RENAME TO trg_colaboradores_updated;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_audit_funcionarios'
      AND tgrelid = 'colaboradores'::regclass
  ) THEN
    ALTER TRIGGER trg_audit_funcionarios ON colaboradores
      RENAME TO trg_audit_colaboradores;
  END IF;
END $$;

-- ============================================================
-- 8. VIEWS
-- ============================================================

DROP VIEW IF EXISTS public.v_funcionarios_ativos;
DROP VIEW IF EXISTS public.v_colaboradores_ativos;
DROP VIEW IF EXISTS public.v_exames_a_vencer;
DROP VIEW IF EXISTS public.v_contratos_a_expirar;

CREATE OR REPLACE VIEW public.v_colaboradores_ativos AS
SELECT
  f.*,
  d.nombre AS departamento_nombre,
  (f.fecha_fin_contrato - CURRENT_DATE)::int AS dias_para_fim
FROM colaboradores f
LEFT JOIN departamentos d ON f.departamento_id = d.id
WHERE f.estado = 'ativo' AND f.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.v_exames_a_vencer AS
SELECT
  em.*,
  f.nombre,
  f.apellido1,
  f.apellido2,
  f.nif,
  (em.fecha_validez - CURRENT_DATE)::int AS dias_para_vencer
FROM exames_medicos em
JOIN colaboradores f ON em.colaborador_id = f.id
WHERE em.fecha_validez >= CURRENT_DATE
  AND em.fecha_validez <= CURRENT_DATE + INTERVAL '30 days'
  AND f.deleted_at IS NULL
ORDER BY em.fecha_validez ASC;

CREATE OR REPLACE VIEW public.v_contratos_a_expirar AS
SELECT
  f.id,
  f.nombre,
  f.apellido1,
  f.nif,
  f.fecha_fin_contrato,
  f.tipo_contrato,
  (f.fecha_fin_contrato - CURRENT_DATE)::int AS dias_para_fim
FROM colaboradores f
WHERE f.estado = 'ativo'
  AND f.fecha_fin_contrato IS NOT NULL
  AND f.fecha_fin_contrato >= CURRENT_DATE
  AND f.fecha_fin_contrato <= CURRENT_DATE + INTERVAL '60 days'
  AND f.deleted_at IS NULL
ORDER BY f.fecha_fin_contrato ASC;

-- ============================================================
-- 9. RLS POLICIES
-- ============================================================
-- Não existe ALTER POLICY ... RENAME, por isso drop + recreate.
-- O DROP usa IF EXISTS e as tabelas já existem (nome novo), pelo que
-- é seguro em BDs antigas e em resets limpos.

-- ---- colaboradores ----
DROP POLICY IF EXISTS "admin_all_funcionarios" ON colaboradores;
DROP POLICY IF EXISTS "admin_all_colaboradores" ON colaboradores;
CREATE POLICY "admin_all_colaboradores" ON colaboradores
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]));

DROP POLICY IF EXISTS "rh_all_funcionarios" ON colaboradores;
DROP POLICY IF EXISTS "rh_all_colaboradores" ON colaboradores;
CREATE POLICY "rh_all_colaboradores" ON colaboradores
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

DROP POLICY IF EXISTS "encarregado_ler_funcionarios" ON colaboradores;
DROP POLICY IF EXISTS "encarregado_ler_colaboradores" ON colaboradores;
CREATE POLICY "encarregado_ler_colaboradores" ON colaboradores
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['encarregado','rh','admin']::role_utilizador[]));

DROP POLICY IF EXISTS "funcionario_ler_proprio" ON colaboradores;
DROP POLICY IF EXISTS "colaborador_ler_proprio" ON colaboradores;
CREATE POLICY "colaborador_ler_proprio" ON colaboradores
  FOR SELECT TO authenticated
  USING (public.utilizador_colaborador_id(auth.uid()) = colaboradores.id);

DROP POLICY IF EXISTS "auditor_ler_funcionarios" ON colaboradores;
DROP POLICY IF EXISTS "auditor_ler_colaboradores" ON colaboradores;
CREATE POLICY "auditor_ler_colaboradores" ON colaboradores
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

-- ---- ferias ----
DROP POLICY IF EXISTS "ferias_proprio" ON ferias;
CREATE POLICY "ferias_proprio" ON ferias
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilizadores u
      WHERE u.user_id = auth.uid()
        AND u.colaborador_id = ferias.colaborador_id
        AND u.ativo = TRUE
    )
  );

DROP POLICY IF EXISTS "ferias_insert_proprio" ON ferias;
CREATE POLICY "ferias_insert_proprio" ON ferias
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilizadores u
      WHERE u.user_id = auth.uid()
        AND u.colaborador_id = ferias.colaborador_id
        AND u.ativo = TRUE
    )
  );

-- ---- marcacoes_ponto ----
DROP POLICY IF EXISTS "ponto_insert" ON marcacoes_ponto;
CREATE POLICY "ponto_insert" ON marcacoes_ponto
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilizadores u
      WHERE u.user_id = auth.uid()
        AND u.colaborador_id = marcacoes_ponto.colaborador_id
        AND u.ativo = TRUE
    )
  );

DROP POLICY IF EXISTS "ponto_select" ON marcacoes_ponto;
CREATE POLICY "ponto_select" ON marcacoes_ponto
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilizadores u
      WHERE u.user_id = auth.uid()
        AND u.ativo = TRUE
        AND (u.role IN ('rh', 'admin', 'encarregado', 'auditor')
             OR u.colaborador_id = marcacoes_ponto.colaborador_id)
    )
  );

-- ---- turnos ----
DROP POLICY IF EXISTS "turnos_select_proprio" ON turnos;
CREATE POLICY "turnos_select_proprio" ON turnos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilizadores u
      WHERE u.user_id = auth.uid()
        AND u.colaborador_id = turnos.colaborador_id
        AND u.ativo = TRUE
    )
  );

-- ---- storage.objects ----
DROP POLICY IF EXISTS "rh_manage_fotos" ON storage.objects;
CREATE POLICY "rh_manage_fotos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'fotos-colaboradores'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['rh','admin']::role_utilizador[])
  )
  WITH CHECK (
    bucket_id = 'fotos-colaboradores'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['rh','admin']::role_utilizador[])
  );

DROP POLICY IF EXISTS "rh_manage_documentos" ON storage.objects;
CREATE POLICY "rh_manage_documentos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id IN ('documentos-colaboradores', 'contratos', 'exames-medicos')
    AND public.utilizador_tem_role(auth.uid(), ARRAY['rh','admin']::role_utilizador[])
  )
  WITH CHECK (
    bucket_id IN ('documentos-colaboradores', 'contratos', 'exames-medicos')
    AND public.utilizador_tem_role(auth.uid(), ARRAY['rh','admin']::role_utilizador[])
  );

DROP POLICY IF EXISTS "funcionario_ler_proprio_documento" ON storage.objects;
DROP POLICY IF EXISTS "colaborador_ler_proprio_documento" ON storage.objects;
CREATE POLICY "colaborador_ler_proprio_documento" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('documentos-colaboradores', 'exames-medicos')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 10. STORAGE BUCKETS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'fotos-funcionarios') THEN
    UPDATE storage.objects SET bucket_id = 'fotos-colaboradores'
    WHERE bucket_id = 'fotos-funcionarios';
    UPDATE storage.buckets SET id = 'fotos-colaboradores', name = 'fotos-colaboradores'
    WHERE id = 'fotos-funcionarios';
  END IF;
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documentos-funcionarios') THEN
    UPDATE storage.objects SET bucket_id = 'documentos-colaboradores'
    WHERE bucket_id = 'documentos-funcionarios';
    UPDATE storage.buckets SET id = 'documentos-colaboradores', name = 'documentos-colaboradores'
    WHERE id = 'documentos-funcionarios';
  END IF;
END $$;

-- ============================================================
-- FIM DA MIGRATION 0004
-- ============================================================
