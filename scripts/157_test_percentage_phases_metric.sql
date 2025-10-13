-- Script para testar criação de métrica "percentual por fases"
-- Executar este script para verificar se há problemas na tabela payment_metrics

-- 1. Verificar estrutura da tabela payment_metrics
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payment_metrics' 
ORDER BY ordinal_position;

-- 2. Verificar constraints da tabela
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
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'payment_metrics';

-- 3. Verificar se há dados na tabela
SELECT COUNT(*) as total_metrics FROM payment_metrics;

-- 4. Verificar se há empresas com tenant_id
SELECT id, name, tenant_id FROM companies WHERE tenant_id IS NOT NULL LIMIT 5;

-- 5. Testar INSERT manual de métrica percentual por fases
INSERT INTO payment_metrics (
    company_id,
    name,
    metric_type,
    planning_percentage,
    homologation_percentage,
    completion_percentage,
    start_date,
    end_date,
    is_active
) VALUES (
    (SELECT id FROM companies WHERE tenant_id IS NOT NULL LIMIT 1),
    'Teste Percentual por Fases',
    'percentage_phases',
    50.0,
    0.0,
    50.0,
    '2025-01-01',
    '2025-12-31',
    true
) RETURNING *;
