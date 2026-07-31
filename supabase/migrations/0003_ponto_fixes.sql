-- ============================================================
-- ERP Matadero — Correções do módulo Ponto
-- Migration 0003: timezone Europe/Madrid no cálculo de horas
-- ============================================================

-- Recria calcular_horas_jornada com timezone explícita.
-- A versão anterior usava DATE(data_hora), que depende da timezone
-- da sessão (normalmente UTC no Supabase), dando resultados errados
-- para um matadouro em Espanha.
CREATE OR REPLACE FUNCTION calcular_horas_jornada(
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

-- ============================================================
-- FIM DA MIGRATION 0003
-- ============================================================
