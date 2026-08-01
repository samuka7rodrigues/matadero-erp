-- ============================================================
-- ERP Matadero — Trigger de registo + backfill de utilizadores
-- Migration 0018
--
-- A 0016 foi inicialmente aplicada com a função RPC
-- criar_utilizador_registo(). Depois mudou-se para trigger
-- AFTER INSERT ON auth.users, mas quem já aplicou a 0016 não tem
-- o trigger. Esta migration:
--   1. (Re)cria a função + trigger on_auth_user_created (idempotente)
--   2. Remove a função RPC antiga
--   3. Backfill: cria a linha em utilizadores para todos os
--      auth.users que ainda não a têm (ex.: eluanarp@gmail.com)
-- ============================================================

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

-- Remove a função RPC antiga (já não é chamada pelo código)
DROP FUNCTION IF EXISTS public.criar_utilizador_registo(text, text, text);

-- ============================================================
-- BACKFILL: utilizadores sem registo em public.utilizadores
-- (conta criada antes do trigger existir)
-- ============================================================

INSERT INTO public.utilizadores (user_id, email, nome_completo, telefone, role, ativo)
SELECT
  au.id,
  au.email,
  NULLIF(au.raw_user_meta_data ->> 'nome_completo', ''),
  NULLIF(au.raw_user_meta_data ->> 'telefone', ''),
  'colaborador',
  TRUE
FROM auth.users au
LEFT JOIN public.utilizadores u ON u.user_id = au.id
WHERE u.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- FIM DA MIGRATION 0018
-- ============================================================
