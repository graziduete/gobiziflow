-- Reverter as mudanças do script 022 - remover campos do Google Sheets
-- que foram adicionados e estão causando problemas

-- Remover as colunas google_sheets_spreadsheet_id e google_sheets_tab
-- da tabela sustentacao_empresa_config

ALTER TABLE public.sustentacao_empresa_config 
DROP COLUMN IF EXISTS google_sheets_spreadsheet_id,
DROP COLUMN IF EXISTS google_sheets_tab;

-- Verificar se as colunas foram removidas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sustentacao_empresa_config'
ORDER BY ordinal_position;