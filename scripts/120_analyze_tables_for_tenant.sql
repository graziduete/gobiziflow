-- Script para analisar tabelas que precisam de tenant_id
-- Este script vai identificar quais tabelas são críticas para multi-tenancy

-- 1. Listar todas as tabelas do sistema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name NOT LIKE 'pg_%'
AND table_name NOT LIKE 'supabase_%'
ORDER BY table_name;

-- 2. Verificar tabelas que já têm company_id (podem precisar de tenant_id)
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE column_name = 'company_id'
AND table_schema = 'public'
ORDER BY table_name;

-- 3. Verificar tabelas que podem ser multi-tenant (baseado no contexto)
-- Estas são as tabelas que provavelmente precisam de tenant_id
SELECT DISTINCT
    table_name
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name IN (
    'projects', 'companies', 'estimativas', 'tasks', 'users', 
    'financeiro', 'receitas', 'despesas', 'categorias'
)
ORDER BY table_name;

-- 4. Verificar se já existe alguma coluna tenant_id
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name LIKE '%tenant%'
AND table_schema = 'public'
ORDER BY table_name;
