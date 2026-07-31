-- ============================================================
-- ERP Matadero — Remover validação de NIF/NIE e unicidade
-- Migration 0005
--
-- O cadastro deve aceitar vários colaboradores mesmo sem
-- documentação completa. Assim:
--  - Remove a restrição UNIQUE do NIF (permite duplicados);
--  - Remove a CHECK de formato do NIF (aceita qualquer valor);
--  - NIF/NIE passam a ser apenas campos informativos/opcionais.
-- ============================================================

-- UNIQUE do NIF (o nome real depende de como a tabela foi criada)
ALTER TABLE public.colaboradores
  DROP CONSTRAINT IF EXISTS colaboradores_nif_key;

ALTER TABLE public.colaboradores
  DROP CONSTRAINT IF EXISTS colaboradors_nif_key;

-- CHECK de formato do NIF
ALTER TABLE public.colaboradores
  DROP CONSTRAINT IF EXISTS chk_nif_formato;

-- UNIQUE do número da Segurança Social (permite duplicados)
ALTER TABLE public.colaboradores
  DROP CONSTRAINT IF EXISTS colaboradores_numero_seguridad_social_key;

ALTER TABLE public.colaboradores
  DROP CONSTRAINT IF EXISTS colaboradors_numero_seguridad_social_key;

-- ============================================================
-- FIM DA MIGRATION 0005
-- ============================================================
