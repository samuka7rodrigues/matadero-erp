-- ============================================================
-- ERP Matadero — Permissões de menus por utilizador
-- Migration 0017
--
-- Permite ao admin definir, na tela de Utilizadores, quais os
-- menus que cada utilizador vê no sidebar.
--
-- Modelo:
--   - Sem registo em permissoes_menus -> usa os menus por defeito
--     do perfil (role) definidos na app.
--   - Com registo -> o array "menus" substitui o padrão do perfil.
--     (apagar o registo volta ao padrão do perfil)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.permissoes_menus (
  user_id    UUID PRIMARY KEY REFERENCES public.utilizadores (user_id) ON DELETE CASCADE,
  menus      TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.permissoes_menus ENABLE ROW LEVEL SECURITY;

-- updated_at automático (helper criado na 0001)
DROP TRIGGER IF EXISTS set_updated_at_permissoes_menus ON public.permissoes_menus;
CREATE TRIGGER set_updated_at_permissoes_menus
  BEFORE UPDATE ON public.permissoes_menus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Admin: gestão total
CREATE POLICY "permissoes_menus_admin_all" ON public.permissoes_menus
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin']::role_utilizador[]));

-- Cada utilizador só lê as próprias permissões (para o AppShell
-- calcular os menus visíveis no sidebar)
CREATE POLICY "permissoes_menus_proprio" ON public.permissoes_menus
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- FIM DA MIGRATION 0017
-- ============================================================
