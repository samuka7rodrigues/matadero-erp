-- ============================================================
-- ERP Matadero — Fix 0006
-- Erro: column "funcionario_id" does not exist (42703)
--
-- A BD tem objectos "fantasma" do schema antigo (naming 'funcionarios')
-- que a migration 0004 renomeou mas não recriou. Este script torna tudo
-- idempotente e consistente:
--   1. Recria as funções helper com o corpo correto.
--   2. Remove policies antigas com nome 'funcionario' e recria as atuais.
--   3. Renomeia qualquer coluna funcionario_id remanescente.
--   4. Remove views/funções antigas que referenciem 'funcionario'.
-- ============================================================

-- 1. FUNÇÕES HELPER (corpo correto, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.utilizador_tem_role(
  uid uuid,
  roles role_utilizador[]
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.utilizadores
    WHERE user_id = uid
      AND role = ANY(roles)
      AND ativo = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.utilizador_colaborador_id(
  uid uuid
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT colaborador_id FROM public.utilizadores
  WHERE user_id = uid AND ativo = TRUE
  LIMIT 1;
$$;

-- 2. RLS POLICIES DE colaboradores (drop de todas + recriação atual)
DROP POLICY IF EXISTS "admin_all_funcionarios" ON colaboradores;
DROP POLICY IF EXISTS "rh_all_funcionarios" ON colaboradores;
DROP POLICY IF EXISTS "encarregado_ler_funcionarios" ON colaboradores;
DROP POLICY IF EXISTS "funcionario_ler_proprio" ON colaboradores;
DROP POLICY IF EXISTS "auditor_ler_funcionarios" ON colaboradores;
DROP POLICY IF EXISTS "admin_all_colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "rh_all_colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "encarregado_ler_colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "colaborador_ler_proprio" ON colaboradores;
DROP POLICY IF EXISTS "auditor_ler_colaboradores" ON colaboradores;

CREATE POLICY "admin_all_colaboradores" ON colaboradores
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]));

CREATE POLICY "rh_all_colaboradores" ON colaboradores
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "encarregado_ler_colaboradores" ON colaboradores
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['encarregado','rh','admin']::role_utilizador[]));

CREATE POLICY "colaborador_ler_proprio" ON colaboradores
  FOR SELECT TO authenticated
  USING (public.utilizador_colaborador_id(auth.uid()) = colaboradores.id);

CREATE POLICY "auditor_ler_colaboradores" ON colaboradores
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

-- 3. RENOMEIA QUALQUER coluna funcionario_id remanescente -> colaborador_id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS tabela, a.attname AS coluna
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','p')
      AND a.attname ILIKE 'funcionario_id%'
      AND a.attnum > 0
      AND NOT a.attisdropped
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I RENAME COLUMN %I TO %I',
      r.tabela, r.coluna, replace(r.coluna, 'funcionario_id', 'colaborador_id')
    );
  END LOOP;
END $$;

-- 4. REMOVE views/funções antigas que referenciem 'funcionario'
DROP VIEW IF EXISTS public.v_funcionarios_ativos;
DROP VIEW IF EXISTS public.v_exames_funcionario;
DROP VIEW IF EXISTS public.v_contratos_funcionarios;

DROP FUNCTION IF EXISTS public.utilizador_funcionario_id(uuid);

-- 5. Policies antigas noutras tabelas (ferias, ponto, turnos, exames, docs)
DROP POLICY IF EXISTS "funcionario_ler_proprio_documento" ON storage.objects;
DROP POLICY IF EXISTS "ferias_funcionario" ON ferias;
DROP POLICY IF EXISTS "ponto_funcionario" ON marcacoes_ponto;
DROP POLICY IF EXISTS "turnos_funcionario" ON turnos;
