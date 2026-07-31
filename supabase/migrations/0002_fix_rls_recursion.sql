-- ============================================================
-- ERP Matadero — Fix RLS "infinite recursion detected in policy for relation utilizadores"
-- Migration 0002
--
-- O problema: as policies da migration 0001 consultam `utilizadores`
-- dentro das policies de `utilizadores` (e de todas as outras tabelas).
-- O Postgres entra em recursão infinita e TODAS as queries com RLS
-- falham com "infinite recursion detected in policy for relation
-- 'utilizadores'".
--
-- Solução: funções SECURITY DEFINER que isolam a consulta a
-- `utilizadores`. Dentro de uma função SECURITY DEFINER o RLS da
-- tabela consultada NÃO é aplicado, portanto não há recursão.
-- ============================================================

-- ============================================================
-- Funções helper (SECURITY DEFINER = bypass de RLS no interior)
-- ============================================================

-- Verifica se um utilizador (auth.uid()) tem um dos roles dados.
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

-- Devolve o colaborador_id ligado ao utilizador (para leitura do próprio).
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

-- ============================================================
-- Drop das policies antigas (com recursão)
-- ============================================================

DROP POLICY IF EXISTS "admin_all_colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "rh_all_colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "encarregado_ler_colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "colaborador_ler_proprio" ON colaboradores;
DROP POLICY IF EXISTS "auditor_ler_colaboradores" ON colaboradores;

DROP POLICY IF EXISTS "admin_all_contratos" ON contratos;
DROP POLICY IF EXISTS "rh_all_contratos" ON contratos;

DROP POLICY IF EXISTS "rh_all_exames" ON exames_medicos;
DROP POLICY IF EXISTS "rh_all_documentos" ON documentos_colaborador;

DROP POLICY IF EXISTS "auditor_ler_audit" ON audit_log;

DROP POLICY IF EXISTS "utilizadores_admin_all" ON utilizadores;
DROP POLICY IF EXISTS "utilizadores_proprio" ON utilizadores;

DROP POLICY IF EXISTS "departamentos_ler" ON departamentos;
DROP POLICY IF EXISTS "departamentos_admin" ON departamentos;

DROP POLICY IF EXISTS "rh_manage_fotos" ON storage.objects;
DROP POLICY IF EXISTS "rh_manage_documentos" ON storage.objects;
DROP POLICY IF EXISTS "colaborador_ler_proprio_documento" ON storage.objects;

-- ============================================================
-- Recreate das policies (agora sem recursão)
-- ============================================================

-- ROLE: admin (acesso total)
CREATE POLICY "admin_all_colaboradores" ON colaboradores
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]));

CREATE POLICY "admin_all_contratos" ON contratos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]));

-- ROLE: rh (CRUD completo)
CREATE POLICY "rh_all_colaboradores" ON colaboradores
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "rh_all_contratos" ON contratos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "rh_all_exames" ON exames_medicos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

CREATE POLICY "rh_all_documentos" ON documentos_colaborador
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

-- ROLE: encarregado (leitura dos seus subordinados — na prática leitura geral)
CREATE POLICY "encarregado_ler_colaboradores" ON colaboradores
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['encarregado','rh','admin']::role_utilizador[]));

-- ROLE: colaborador (só vê os seus próprios dados)
CREATE POLICY "colaborador_ler_proprio" ON colaboradores
  FOR SELECT TO authenticated
  USING (public.utilizador_colaborador_id(auth.uid()) = colaboradores.id);

-- ROLE: auditor (leitura de tudo)
CREATE POLICY "auditor_ler_colaboradores" ON colaboradores
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor']::role_utilizador[]));

CREATE POLICY "auditor_ler_audit" ON audit_log
  FOR SELECT TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['auditor','admin']::role_utilizador[]));

-- Utilizadores: só admin pode gerir (função evita recursão)
CREATE POLICY "utilizadores_admin_all" ON utilizadores
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]));

-- Utilizadores: cada um pode ler o próprio
CREATE POLICY "utilizadores_proprio" ON utilizadores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Departamentos: leitura para todos (dados não sensíveis)
CREATE POLICY "departamentos_ler" ON departamentos
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "departamentos_admin" ON departamentos
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh']::role_utilizador[]));

-- ============================================================
-- Storage
-- ============================================================

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

CREATE POLICY "colaborador_ler_proprio_documento" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('documentos-colaboradores', 'exames-medicos')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- FIM DA MIGRATION 0002
-- ============================================================
