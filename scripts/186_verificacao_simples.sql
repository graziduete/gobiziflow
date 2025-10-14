-- Script: 186_verificacao_simples.sql
-- Verificação simples do impacto
-- Data: 2025-10-14

-- Verificação completa em um SELECT só
SELECT 
    'IMPACTO DA REMOÇÃO FK' as info,
    COUNT(*) as total_receitas,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as receitas_admin_normal,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as receitas_client_admin,
    CASE 
        WHEN COUNT(CASE WHEN tc.constraint_name IS NOT NULL THEN 1 END) > 0 
        THEN 'TEM FOREIGN KEY'
        ELSE 'SEM FOREIGN KEY'
    END as status_constraint
FROM revenue_entries re
LEFT JOIN information_schema.table_constraints tc 
    ON tc.table_name = 'revenue_entries' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
LEFT JOIN information_schema.key_column_usage kcu 
    ON kcu.constraint_name = tc.constraint_name 
    AND kcu.column_name = 'tenant_id';
