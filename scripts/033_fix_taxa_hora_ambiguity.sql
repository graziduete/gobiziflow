-- =============================================================================
-- Script: Corrigir Ambiguidade da Coluna taxa_hora
-- Descrição: Corrige o erro de ambiguidade na função calcular_custo_semanal
-- Data: $(date)
-- =============================================================================

-- Atualizar função para especificar tabela na consulta
CREATE OR REPLACE FUNCTION calcular_custo_semanal()
RETURNS TRIGGER AS $$
DECLARE
  taxa_hora_recurso DECIMAL(8,2);
BEGIN
  -- Buscar taxa horária do recurso (especificando tabela)
  SELECT recursos_estimativa.taxa_hora INTO taxa_hora_recurso
  FROM recursos_estimativa 
  WHERE recursos_estimativa.id = NEW.recurso_id;

  -- Calcular custo semanal
  NEW.custo_semanal = NEW.horas * taxa_hora_recurso;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar se a função foi atualizada corretamente
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'calcular_custo_semanal';
