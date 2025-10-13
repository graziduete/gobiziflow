-- Script para testar se o problema é o campo homologation_percentage = 0

-- 1. Verificar se há constraints específicas nos campos de percentual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'payment_metrics' 
AND column_name IN ('planning_percentage', 'homologation_percentage', 'completion_percentage')
ORDER BY column_name;

-- 2. Verificar se há constraints CHECK nos campos de percentual
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'payment_metrics'
AND tc.constraint_type = 'CHECK';

-- 3. Testar INSERT com homologation_percentage = NULL em vez de 0
INSERT INTO payment_metrics (
    company_id,
    name,
    metric_type,
    total_value,
    planning_percentage,
    homologation_percentage,
    completion_percentage,
    start_date,
    end_date,
    is_active
) VALUES (
    (SELECT id FROM companies WHERE tenant_id IS NOT NULL LIMIT 1),
    'Teste com homologation NULL',
    'percentage_phases',
    0,
    50,
    NULL,  -- NULL em vez de 0
    50,
    '2025-01-01',
    '2025-12-31',
    true
) RETURNING *;

-- 4. Se o teste acima funcionar, testar com valor 1 em vez de 0
INSERT INTO payment_metrics (
    company_id,
    name,
    metric_type,
    total_value,
    planning_percentage,
    homologation_percentage,
    completion_percentage,
    start_date,
    end_date,
    is_active
) VALUES (
    (SELECT id FROM companies WHERE tenant_id IS NOT NULL LIMIT 1),
    'Teste com homologation 1',
    'percentage_phases',
    0,
    50,
    1,  -- 1 em vez de 0
    50,
    '2025-01-01',
    '2025-12-31',
    true
) RETURNING *;
