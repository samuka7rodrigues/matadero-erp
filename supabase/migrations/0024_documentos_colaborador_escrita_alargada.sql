-- ============================================================
-- ERP Matadero — Anexar documentos de colaboradores
-- Migration 0024
--
-- Objetivo: qualquer utilizador com acesso à tela de colaboradores
-- (admin, rh, encarregado, auditor) pode anexar e remover documentos.
-- A leitura já está aberta a todos os autenticados (migration 0022);
-- esta migration alarga a escrita.
-- ============================================================

-- ============================================================
-- 1) Tabela documentos_colaborador — escrita alargada
-- ============================================================

DROP POLICY IF EXISTS "rh_all_documentos" ON documentos_colaborador;

CREATE POLICY "rh_all_documentos" ON documentos_colaborador
  FOR ALL TO authenticated
  USING (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh','encarregado','auditor']::role_utilizador[]))
  WITH CHECK (public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh','encarregado','auditor']::role_utilizador[]));

-- ============================================================
-- 2) Storage bucket 'documentos-colaboradores' — escrita alargada
-- ============================================================

DROP POLICY IF EXISTS "docs_colaborador_gerir_geral" ON storage.objects;

CREATE POLICY "docs_colaborador_gerir_geral" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'documentos-colaboradores'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh','encarregado','auditor']::role_utilizador[])
  )
  WITH CHECK (
    bucket_id = 'documentos-colaboradores'
    AND public.utilizador_tem_role(auth.uid(), ARRAY['admin','rh','encarregado','auditor']::role_utilizador[])
  );

-- ============================================================
-- FIM DA MIGRATION 0024
-- ============================================================
