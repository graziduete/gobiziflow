-- Script para sincronizar previsões existentes dos projetos
-- Este script deve ser executado após criar a tabela project_forecasts

-- Inserir previsões para projetos existentes baseado no status atual
INSERT INTO project_forecasts (
  project_id, 
  month_year, 
  forecast_amount, 
  forecast_percentage, 
  status_when_forecasted, 
  budget_amount, 
  company_id,
  created_at,
  updated_at
)
SELECT 
  p.id as project_id,
  '2025-09' as month_year, -- Mês atual (ajustar conforme necessário)
  CASE 
    WHEN p.status = 'planning' THEN (p.budget * 20) / 100
    WHEN p.status = 'homologation' THEN (p.budget * 30) / 100
    WHEN p.status = 'completed' THEN (p.budget * 50) / 100
    ELSE 0
  END as forecast_amount,
  CASE 
    WHEN p.status = 'planning' THEN 20
    WHEN p.status = 'homologation' THEN 30
    WHEN p.status = 'completed' THEN 50
    ELSE 0
  END as forecast_percentage,
  p.status as status_when_forecasted,
  p.budget as budget_amount,
  p.company_id,
  NOW() as created_at,
  NOW() as updated_at
FROM projects p
WHERE p.budget > 0 
  AND p.status IN ('planning', 'homologation', 'completed')
  AND NOT EXISTS (
    SELECT 1 FROM project_forecasts pf 
    WHERE pf.project_id = p.id 
    AND pf.month_year = '2025-09'
  );

-- Verificar previsões criadas
SELECT 
  pf.month_year,
  COUNT(*) as total_forecasts,
  SUM(pf.forecast_amount) as total_forecast_amount,
  AVG(pf.forecast_percentage) as avg_percentage
FROM project_forecasts pf
GROUP BY pf.month_year; 