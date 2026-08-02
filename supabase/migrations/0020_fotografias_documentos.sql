-- ============================================================
-- 0020: fotografias -> aceitar também PDF (documentos da vivenda)
-- Adiciona nome original e tipo MIME para distinguir imagem/PDF.
-- ============================================================

ALTER TABLE fotografias
  ADD COLUMN IF NOT EXISTS nombre TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

COMMENT ON COLUMN fotografias.nombre IS 'Nome original do ficheiro carregado';
COMMENT ON COLUMN fotografias.mime_type IS 'Tipo MIME do ficheiro (image/* ou application/pdf)';
