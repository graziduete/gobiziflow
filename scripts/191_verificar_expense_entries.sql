-- Script: 191_verificar_expense_entries.sql
-- Verificar estrutura atual da tabela expense_entries
-- Data: 2025-10-14
-- Descrição: Analisa a tabela expense_entries para implementar multi-tenancy

-- Verificação completa em um SELECT só
SELECT 
    'EXPENSE_ENTRIES - VERIFICAÇÃO COMPLETA' as info,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as registros_tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as registros_tenant_preenchido,
    CASE 
        WHEN COUNT(CASE WHEN ic.column_name = 'tenant_id' THEN 1 END) > 0 
        THEN 'TEM COLUNA tenant_id'
        ELSE 'SEM COLUNA tenant_id'
    END as status_tenant_id
FROM expense_entries
CROSS JOIN information_schema.columns ic
WHERE ic.table_name = 'expense_entries';
