-- Verificar todas as métricas de pagamento
SELECT 
    pm.id,
    pm.name,
    pm.metric_type,
    pm.is_active,
    c.name as company_name,
    pm.planning_percentage,
    pm.homologation_percentage,
    pm.completion_percentage,
    pm.created_at
FROM payment_metrics pm
JOIN companies c ON pm.company_id = c.id
ORDER BY pm.created_at DESC;

-- Verificar se há métricas "percentage_phases" (mesmo inativas)
SELECT 
    pm.id,
    pm.name,
    pm.metric_type,
    pm.is_active,
    c.name as company_name,
    pm.planning_percentage,
    pm.homologation_percentage,
    pm.completion_percentage
FROM payment_metrics pm
JOIN companies c ON pm.company_id = c.id
WHERE pm.metric_type = 'percentage_phases';
