-- Adicionar campos para configuração do Google Sheets por empresa
ALTER TABLE sustentacao_empresa_config 
ADD COLUMN google_sheets_spreadsheet_id VARCHAR(255),
ADD COLUMN google_sheets_tab VARCHAR(255) DEFAULT 'Sheet1';

-- Comentário explicativo
COMMENT ON COLUMN sustentacao_empresa_config.google_sheets_spreadsheet_id IS 'ID da planilha do Google Sheets específica da empresa (opcional, usa padrão se null)';
COMMENT ON COLUMN sustentacao_empresa_config.google_sheets_tab IS 'Nome da aba na planilha do Google Sheets (padrão: Sheet1)';