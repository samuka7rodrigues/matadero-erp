-- ============================================================
-- ERP Matadero — Perfil de utilizadores e autoregisto
-- Migration 0016
--
-- 1. Colunas novas em utilizadores: nome_completo, telefone
-- 2. Trigger AFTER INSERT ON auth.users
--    -> cria automaticamente o registo em utilizadores aquando
--       do signUp (role 'colaborador' por defeito), lendo nome e
--       telefone de raw_user_meta_data
-- 3. Função SECURITY DEFINER atualizar_meu_telefone()
--    -> o utilizador edita apenas o próprio telefone (sem poder
--       alterar role nem email via RLS)
-- ============================================================

-- ============================================================
-- COLUNAS NOVAS
-- ============================================================

ALTER TABLE utilizadores
  ADD COLUMN IF NOT EXISTS nome_completo TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT;

COMMENT ON COLUMN utilizadores.nome_completo IS 'Nome do utilizador (autoregisto sem colaborador)';
COMMENT ON COLUMN utilizadores.telefone IS 'Telefone de contacto do utilizador';

-- ============================================================
-- TRIGGER: criar_utilizador_registo_trigger
-- Dispara sempre que um utilizador é criado em auth.users
-- (signUp, admin_create_user, dashboard, etc.). Insere a linha em
-- utilizadores com role 'colaborador'. Como o seed usa
-- ON CONFLICT DO UPDATE com a role explícita, as roles de admin/
-- gestor são preservadas. Nome e telefone vêm de raw_user_meta_data
-- (data: { nome_completo, telefone } no signUp).
-- ============================================================

-- Remove a função RPC antiga (usada antes do trigger), se existir.
DROP FUNCTION IF EXISTS public.criar_utilizador_registo(text, text, text);

CREATE OR REPLACE FUNCTION public.criar_utilizador_registo_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.utilizadores (user_id, email, nome_completo, telefone, role, ativo)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'nome_completo', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'telefone', ''),
    'colaborador',
    TRUE
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_utilizador_registo_trigger() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_utilizador_registo_trigger() TO anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_utilizador_registo_trigger();

-- ============================================================
-- FUNÇÃO: atualizar_meu_telefone
-- Permite que cada utilizador atualize apenas o seu telefone,
-- sem expor um UPDATE direto na tabela (evita escalar role/email).
-- ============================================================

CREATE OR REPLACE FUNCTION public.atualizar_meu_telefone(
  p_telefone text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_updated integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.utilizadores
  SET telefone = NULLIF(p_telefone, '')
  WHERE user_id = v_uid;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.atualizar_meu_telefone(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atualizar_meu_telefone(text) TO authenticated;

-- ============================================================
-- FIM DA MIGRATION 0016
-- ============================================================
