-- ============================================================
-- ERP Matadero — Leitura geral para utilizadores autenticados
-- Migration 0022
--
-- Objetivo: quem tem sessão iniciada e menu vê todos os registos
-- de dados (menu = dados). As permissões de escrita continuam por
-- role (as políticas FOR ALL/INSERT/UPDATE/DELETE mantêm-se).
--
-- 1) Em cada tabela de dados do schema public, substitui as
--    políticas de SELECT por uma única política de leitura para
--    todos os autenticados.
-- 2) Storage: leitura de ficheiros para todos os autenticados.
-- ============================================================

-- ============================================================
-- 1) Tabelas de dados do schema public
-- ============================================================

DO $$
DECLARE
    t text;
    p record;
BEGIN
    FOR t IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relrowsecurity = true
          AND c.relname NOT IN ('permissoes_menus', 'audit_log')
        ORDER BY c.relname
    LOOP
        -- Remove as políticas de SELECT existentes nesta tabela
        FOR p IN
            SELECT policyname
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = t
              AND cmd = 'SELECT'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
        END LOOP;

        -- Leitura aberta a todos os autenticados
        EXECUTE format(
            'CREATE POLICY leitura_geral_autenticados ON public.%I FOR SELECT TO authenticated USING (true)',
            t
        );
    END LOOP;
END
$$;

-- ============================================================
-- 2) Storage: leitura de ficheiros para todos os autenticados
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'leitura_geral_autenticados'
    ) THEN
        CREATE POLICY leitura_geral_autenticados
            ON storage.objects
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END
$$;

-- ============================================================
-- FIM DA MIGRATION 0022
-- ============================================================
