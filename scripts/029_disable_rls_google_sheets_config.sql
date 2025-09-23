-- Script 029: Desabilitar RLS temporariamente para sustentacao_google_sheets_config
-- IMPORTANTE: Apenas para teste - reabilitar depois

-- Desabilitar RLS temporariamente
ALTER TABLE public.sustentacao_google_sheets_config DISABLE ROW LEVEL SECURITY;

-- Comentário explicativo
COMMENT ON TABLE public.sustentacao_google_sheets_config IS 
'Tabela para configurações de Google Sheets por empresa. RLS desabilitado temporariamente para teste.';