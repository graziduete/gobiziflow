-- Teste da constraint payment_metrics_percentages_sum_check
-- Esta constraint exige que planning_percentage + homologation_percentage + completion_percentage = 100
-- para métricas do tipo 'percentage_phases'

-- Teste 1: Soma = 100 (deve funcionar)
INSERT INTO payment_metrics (
    company_id,
    name,
    metric_type,
    total_value,
    total_hours,
    planning_percentage,
    homologation_percentage,
    completion_percentage,
    start_date,
    end_date,
    is_active
) VALUES (
    (SELECT id FROM companies WHERE tenant_id IS NOT NULL LIMIT 1),
    'Teste Soma 100',
    'percentage_phases',
    0,
    NULL,
    50,
    0,  -- homologation = 0
    50, -- total: 50 + 0 + 50 = 100
    '2025-01-01',
    '2025-12-31',
    true
) RETURNING *;

-- Teste 2: Soma != 100 (deve falhar)
INSERT INTO payment_metrics (
    company_id,
    name,
    metric_type,
    total_value,
    total_hours,
    planning_percentage,
    homologation_percentage,
    completion_percentage,
    start_date,
    end_date,
    is_active
) VALUES (
    (SELECT id FROM companies WHERE tenant_id IS NOT NULL LIMIT 1),
    'Teste Soma 80',
    'percentage_phases',
    0,
    NULL,
    50,
    0,  -- homologation = 0
    30, -- total: 50 + 0 + 30 = 80 (deve falhar)
    '2025-01-01',
    '2025-12-31',
    true
) RETURNING *;
