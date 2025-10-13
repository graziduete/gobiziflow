-- Script para debugar métricas "percentual por fases"
-- Execute este script para verificar se tudo está correto

-- 1. Verificar se existe métrica "percentual por fases" ativa
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
WHERE pm.metric_type = 'percentage_phases' 
AND pm.is_active = true;

-- 2. Verificar projetos da empresa com métrica "percentual por fases"
SELECT 
    p.id,
    p.name,
    p.budget,
    p.status,
    p.end_date,
    c.name as company_name
FROM projects p
JOIN companies c ON p.company_id = c.id
WHERE c.id IN (
    SELECT company_id 
    FROM payment_metrics 
    WHERE metric_type = 'percentage_phases' 
    AND is_active = true
)
AND p.status IN ('planning', 'in_progress', 'development', 'testing', 'homologation', 'completed');

-- 3. Verificar se há projetos que terminam em 2025
SELECT 
    p.name,
    p.budget,
    p.end_date,
    EXTRACT(YEAR FROM p.end_date::date) as end_year,
    c.name as company_name
FROM projects p
JOIN companies c ON p.company_id = c.id
WHERE c.id IN (
    SELECT company_id 
    FROM payment_metrics 
    WHERE metric_type = 'percentage_phases' 
    AND is_active = true
)
AND EXTRACT(YEAR FROM p.end_date::date) = 2025;
