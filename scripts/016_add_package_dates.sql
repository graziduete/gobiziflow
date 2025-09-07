-- Script para adicionar colunas de período do pacote de horas na tabela companies
-- Data: 2025-01-XX

-- Adicionar colunas de período do pacote de horas
ALTER TABLE companies
ADD COLUMN package_start_date DATE,
ADD COLUMN package_end_date DATE;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN companies.package_start_date IS 'Data de início da vigência do pacote de horas (formato YYYY-MM)';
COMMENT ON COLUMN companies.package_end_date IS 'Data de término da vigência do pacote de horas (formato YYYY-MM)';

-- Criar índices para melhorar performance de consultas por período
CREATE INDEX IF NOT EXISTS idx_companies_package_start_date ON companies(package_start_date);
CREATE INDEX IF NOT EXISTS idx_companies_package_end_date ON companies(package_end_date);

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
AND column_name IN ('package_start_date', 'package_end_date');

-- Exemplo de uso:
-- UPDATE companies 
-- SET package_start_date = '2025-09-01', package_end_date = '2026-03-01'
-- WHERE name = 'Copersucar' AND has_hour_package = true; 