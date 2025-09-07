-- Script para debug das constraints da tabela payment_metrics
-- Execute este script para verificar se há problemas de constraint

-- Verificar a estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_metrics' 
ORDER BY ordinal_position;

-- Verificar constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'payment_metrics';

-- Verificar se a tabela hour_packages existe e tem dados
SELECT COUNT(*) as total_packages FROM hour_packages;

-- Verificar se há pacotes ativos
SELECT COUNT(*) as active_packages FROM hour_packages WHERE is_current = true;

-- Verificar se há empresas com pacotes
SELECT 
    c.id as company_id,
    c.name as company_name,
    hp.id as package_id,
    hp.is_current
FROM companies c
LEFT JOIN hour_packages hp ON c.id = hp.company_id
ORDER BY c.name;