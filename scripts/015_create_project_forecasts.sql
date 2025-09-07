-- Script para criar tabela de previsões de projetos
-- Esta tabela rastreia as previsões mensais de faturamento baseadas no status dos projetos

-- Criar tabela project_forecasts
CREATE TABLE IF NOT EXISTS project_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- formato: "2025-09"
  forecast_amount DECIMAL(10,2) NOT NULL,
  forecast_percentage INTEGER NOT NULL, -- 20, 30, 50
  status_when_forecasted VARCHAR(20) NOT NULL, -- status do projeto quando foi previsto
  budget_amount DECIMAL(10,2) NOT NULL, -- orçamento do projeto quando foi previsto
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_project_forecasts_project_id ON project_forecasts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_forecasts_month_year ON project_forecasts(month_year);
CREATE INDEX IF NOT EXISTS idx_project_forecasts_company_id ON project_forecasts(company_id);
CREATE INDEX IF NOT EXISTS idx_project_forecasts_project_month ON project_forecasts(project_id, month_year);

-- Criar constraint para evitar previsões duplicadas do mesmo projeto no mesmo mês
ALTER TABLE project_forecasts 
ADD CONSTRAINT unique_project_month_forecast 
UNIQUE (project_id, month_year);

-- Comentários para documentação
COMMENT ON TABLE project_forecasts IS 'Tabela para rastrear previsões mensais de faturamento dos projetos';
COMMENT ON COLUMN project_forecasts.month_year IS 'Mês/ano da previsão no formato YYYY-MM';
COMMENT ON COLUMN project_forecasts.forecast_amount IS 'Valor previsto para o mês (orçamento × percentual)';
COMMENT ON COLUMN project_forecasts.forecast_percentage IS 'Percentual aplicado baseado no status (20%, 30%, 50%)';
COMMENT ON COLUMN project_forecasts.status_when_forecasted IS 'Status do projeto quando a previsão foi criada';
COMMENT ON COLUMN project_forecasts.budget_amount IS 'Orçamento do projeto quando a previsão foi criada';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_forecasts_updated_at 
    BEFORE UPDATE ON project_forecasts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 