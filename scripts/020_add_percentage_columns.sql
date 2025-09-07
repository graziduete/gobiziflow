-- Script para adicionar colunas de percentuais à tabela payment_metrics
-- Executar após os scripts anteriores

-- Adicionar colunas de percentuais para métricas do tipo "percentage_phases"
ALTER TABLE payment_metrics 
ADD COLUMN IF NOT EXISTS planning_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS homologation_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN payment_metrics.planning_percentage IS 'Percentual para fase de planejamento (0-100)';
COMMENT ON COLUMN payment_metrics.homologation_percentage IS 'Percentual para fase de homologação (0-100)';
COMMENT ON COLUMN payment_metrics.completion_percentage IS 'Percentual para fase de conclusão (0-100)';

-- Adicionar constraint para validar que a soma dos percentuais seja 100
ALTER TABLE payment_metrics 
ADD CONSTRAINT payment_metrics_percentages_sum_check 
CHECK (
  (metric_type != 'percentage_phases') OR 
  (planning_percentage + homologation_percentage + completion_percentage = 100)
);

-- Adicionar constraint para validar que percentuais sejam entre 0 e 100
ALTER TABLE payment_metrics 
ADD CONSTRAINT payment_metrics_percentages_range_check 
CHECK (
  (metric_type != 'percentage_phases') OR 
  (planning_percentage >= 0 AND planning_percentage <= 100 AND
   homologation_percentage >= 0 AND homologation_percentage <= 100 AND
   completion_percentage >= 0 AND completion_percentage <= 100)
);