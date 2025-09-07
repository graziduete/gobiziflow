-- Script para implementar trigger automático de previsões
-- Este script cria um trigger que insere/atualiza previsões automaticamente
-- quando projetos são criados ou atualizados

-- 1. Criar função para inserir/atualizar previsões automaticamente
CREATE OR REPLACE FUNCTION auto_create_forecast()
RETURNS TRIGGER AS $$
DECLARE
  forecast_amount DECIMAL(10,2);
  forecast_percentage INTEGER;
  current_month_year VARCHAR(7);
BEGIN
  -- Calcular mês/ano atual
  current_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Calcular percentual baseado no status
  CASE NEW.status
    WHEN 'planning' THEN 
      forecast_percentage := 20;
    WHEN 'homologation' THEN 
      forecast_percentage := 30;
    WHEN 'completed' THEN 
      forecast_percentage := 50;
    ELSE 
      forecast_percentage := 0;
  END CASE;
  
  -- Calcular valor da previsão
  IF NEW.budget > 0 AND forecast_percentage > 0 THEN
    forecast_amount := (NEW.budget * forecast_percentage) / 100;
    
    -- Inserir ou atualizar previsão
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
    ) VALUES (
      NEW.id, 
      current_month_year,
      forecast_amount,
      forecast_percentage,
      NEW.status,
      NEW.budget,
      NEW.company_id,
      NOW(),
      NOW()
    )
    ON CONFLICT (project_id, month_year) 
    DO UPDATE SET
      forecast_amount = EXCLUDED.forecast_amount,
      forecast_percentage = EXCLUDED.forecast_percentage,
      status_when_forecasted = EXCLUDED.status_when_forecasted,
      budget_amount = EXCLUDED.budget_amount,
      updated_at = NOW();
      
    RAISE NOTICE 'Previsão criada/atualizada para projeto %: R$ % (%%)', 
      NEW.name, forecast_amount, forecast_percentage;
  ELSE
    -- Se não gera previsão, remover previsão existente se houver
    DELETE FROM project_forecasts 
    WHERE project_id = NEW.id 
    AND month_year = current_month_year;
    
    RAISE NOTICE 'Previsão removida para projeto % (status: %)', 
      NEW.name, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger na tabela projects
DROP TRIGGER IF EXISTS trigger_auto_create_forecast ON projects;

CREATE TRIGGER trigger_auto_create_forecast
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_forecast();

-- 3. Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_create_forecast';

-- 4. Testar o trigger com um projeto existente
-- (Execute este comando para testar se está funcionando)
-- UPDATE projects SET status = 'planning' WHERE id = (SELECT id FROM projects LIMIT 1);

-- 5. Verificar previsões criadas
-- SELECT 
--   pf.month_year,
--   pf.forecast_amount,
--   pf.forecast_percentage,
--   p.name as project_name,
--   p.status as current_status,
--   p.budget
-- FROM project_forecasts pf
-- JOIN projects p ON pf.project_id = p.id
-- ORDER BY pf.forecast_amount DESC; 