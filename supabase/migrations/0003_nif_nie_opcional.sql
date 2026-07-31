-- ============================================================
-- ERP Matadero — NIF deixa de ser obrigatório (NIF ou NIE)
-- Migration 0003
--
-- O cadastro deve aceitar colaboradores que só tenham NIE
-- (estrangeiros). A coluna nif passa a ser nullable; a CHECK de
-- formato e a UNIQUE continuam a valer apenas para valores não
-- nulos (Postgres permite múltiplos NULL em coluna UNIQUE).
-- ============================================================

ALTER TABLE public.colaboradores
  ALTER COLUMN nif DROP NOT NULL;

-- ============================================================
-- FIM DA MIGRATION 0003
-- ============================================================
