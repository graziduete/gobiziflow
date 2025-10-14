-- Script: 190_fix_categories_tenant.sql
-- Corrigir tenant_id nas tabelas de categorias
-- Data: 2025-10-14
-- Descrição: Remove tenant_id de expense_categories (categorias fixas)

-- 1. Verificar dados atuais
SELECT 
    'ANTES DA CORREÇÃO' as info,
    'expense_categories' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as registros_tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as registros_tenant_preenchido
FROM expense_categories

UNION ALL

SELECT 
    'ANTES DA CORREÇÃO' as info,
    'expense_subcategories' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as registros_tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as registros_tenant_preenchido
FROM expense_subcategories;

-- 2. Remover tenant_id de expense_categories (categorias são fixas)
ALTER TABLE expense_categories DROP COLUMN IF EXISTS tenant_id;

-- 3. Remover índice de expense_categories
DROP INDEX IF EXISTS idx_expense_categories_tenant_id;

-- 4. Verificar se expense_subcategories ainda tem tenant_id
SELECT 
    'APÓS CORREÇÃO' as info,
    'expense_categories' as tabela,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'tenant_id' THEN 1 END) > 0 
        THEN 'AINDA TEM COLUNA tenant_id'
        ELSE 'COLUNA tenant_id REMOVIDA'
    END as status_tenant_id
FROM expense_categories
CROSS JOIN information_schema.columns ic
WHERE ic.table_name = 'expense_categories'

UNION ALL

SELECT 
    'APÓS CORREÇÃO' as info,
    'expense_subcategories' as tabela,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'tenant_id' THEN 1 END) > 0 
        THEN 'AINDA TEM COLUNA tenant_id'
        ELSE 'COLUNA tenant_id REMOVIDA'
    END as status_tenant_id
FROM expense_subcategories
CROSS JOIN information_schema.columns ic
WHERE ic.table_name = 'expense_subcategories';
