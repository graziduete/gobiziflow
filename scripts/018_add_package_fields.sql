-- Script para adicionar campos de pacote de horas na tabela companies
-- Data: 2025-01-XX

-- Adicionar colunas para tipo de contratação e modelo de conta
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS package_type VARCHAR(20) DEFAULT 'period',
ADD COLUMN IF NOT EXISTS account_model VARCHAR(20) DEFAULT 'standard';

-- Adicionar constraint para package_type
ALTER TABLE companies 
ADD CONSTRAINT check_package_type 
CHECK (package_type IN ('monthly', 'period'));

-- Adicionar constraint para account_model
ALTER TABLE companies 
ADD CONSTRAINT check_account_model 
CHECK (account_model IN ('standard', 'current_account'));

-- Adicionar comentários
COMMENT ON COLUMN companies.package_type IS 'Tipo de contratação: monthly (mensal) ou period (período)';
COMMENT ON COLUMN companies.account_model IS 'Modelo: standard (padrão) ou current_account (conta corrente)';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'companies'
AND column_name IN ('package_type', 'account_model')
ORDER BY column_name;

-- Exemplo de uso:
-- UPDATE companies
-- SET package_type = 'monthly', account_model = 'current_account'
-- WHERE name = 'Empresa Exemplo' AND has_hour_package = true; 