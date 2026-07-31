-- Adicionar campo opcional de passaporte aos colaboradores
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS passaporte TEXT;
