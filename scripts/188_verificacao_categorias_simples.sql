-- Script: 188_verificacao_categorias_simples.sql
-- Verificação simples das categorias
-- Data: 2025-10-14

-- Verificação completa em um SELECT só
SELECT 
    'CATEGORIAS - VERIFICAÇÃO COMPLETA' as info,
    'expense_categories' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as registros_tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as registros_tenant_preenchido,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'tenant_id' THEN 1 END) > 0 
        THEN 'TEM COLUNA tenant_id'
        ELSE 'SEM COLUNA tenant_id'
    END as status_tenant_id
FROM expense_categories
CROSS JOIN information_schema.columns ic
WHERE ic.table_name = 'expense_categories'

UNION ALL

SELECT 
    'SUBCATEGORIAS - VERIFICAÇÃO COMPLETA' as info,
    'expense_subcategories' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as registros_tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as registros_tenant_preenchido,
    CASE 
        WHEN COUNT(CASE WHEN column_name = 'tenant_id' THEN 1 END) > 0 
        THEN 'TEM COLUNA tenant_id'
        ELSE 'SEM COLUNA tenant_id'
    END as status_tenant_id
FROM expense_subcategories
CROSS JOIN information_schema.columns ic
WHERE ic.table_name = 'expense_subcategories';
