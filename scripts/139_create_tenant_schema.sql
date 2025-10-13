-- Script para criar schema de tenant genérico
-- Este script cria um schema separado para cada empresa cliente

-- 1. Função para criar schema de tenant automaticamente
CREATE OR REPLACE FUNCTION create_tenant_schema(company_id UUID)
RETURNS TEXT AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Converter UUID para nome de schema (substituir hífens por underscores)
    schema_name := 'tenant_' || replace(company_id::text, '-', '_');
    
    -- Criar o schema
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || schema_name;
    
    RAISE NOTICE 'Schema criado: %', schema_name;
    RETURN schema_name;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar schema para Agile Point (usando o company_id existente)
-- Primeiro vamos buscar o company_id da Agile Point
SELECT 
    id,
    corporate_name,
    full_name,
    email
FROM client_companies 
WHERE email LIKE '%contatoagilepoint%'
LIMIT 1;

-- 3. Criar schema para Agile Point (substitua o ID pelo valor encontrado acima)
-- Exemplo: tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2
SELECT create_tenant_schema('1aad7589-6ec0-48c1-b192-5cbe1f3193f2');

-- 4. Verificar se o schema foi criado
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%';

-- 5. Comentários para documentação
COMMENT ON FUNCTION create_tenant_schema(UUID) IS 'Função para criar schema de tenant baseado no company_id da client_companies';
