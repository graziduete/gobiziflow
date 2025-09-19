-- Script para adicionar campos do Google Sheets na tabela sustentacao_empresa_config
-- Execute este script diretamente no Supabase SQL Editor

-- Adicionar campos para configuração do Google Sheets por empresa
ALTER TABLE sustentacao_empresa_config 
ADD COLUMN IF NOT EXISTS google_sheets_spreadsheet_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_sheets_tab VARCHAR(255) DEFAULT 'Sheet1';

-- Comentários explicativos
COMMENT ON COLUMN sustentacao_empresa_config.google_sheets_spreadsheet_id IS 'ID da planilha do Google Sheets específica da empresa (opcional, usa padrão se null)';
COMMENT ON COLUMN sustentacao_empresa_config.google_sheets_tab IS 'Nome da aba na planilha do Google Sheets (padrão: Sheet1)';

-- Verificar se os campos foram adicionados
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'sustentacao_empresa_config' 
AND column_name IN ('google_sheets_spreadsheet_id', 'google_sheets_tab');