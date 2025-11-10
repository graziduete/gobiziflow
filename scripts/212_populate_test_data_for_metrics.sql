-- =====================================================
-- Script: 212_populate_test_data_for_metrics.sql
-- Descrição: Popular dados de teste para validar métricas de desempenho
-- Data: 2025-11-10
-- Objetivo: Criar cenários realistas de tarefas para testar o card de métricas
-- =====================================================

-- ⚠️ ATENÇÃO: Este script atualiza tarefas de UM projeto específico
-- Altere o PROJECT_ID abaixo se necessário

-- Configuração
DO $$
DECLARE
  target_project_id UUID := 'dd13f521-e0d1-458b-aae3-2d2dff19e52f'; -- ALTERE SE NECESSÁRIO
  task_record RECORD;
  task_count INTEGER := 0;
BEGIN
  
  RAISE NOTICE '🎯 Iniciando população de dados de teste...';
  RAISE NOTICE 'Projeto alvo: %', target_project_id;
  
  -- Verificar se o projeto existe
  IF NOT EXISTS (SELECT 1 FROM projects WHERE id = target_project_id) THEN
    RAISE EXCEPTION '❌ Projeto % não encontrado!', target_project_id;
  END IF;
  
  -- Contar tarefas
  SELECT COUNT(*) INTO task_count FROM tasks WHERE project_id = target_project_id;
  RAISE NOTICE '📊 Tarefas encontradas: %', task_count;
  
  IF task_count = 0 THEN
    RAISE EXCEPTION '❌ Nenhuma tarefa encontrada para este projeto!';
  END IF;
  
  -- Limpar dados anteriores de teste (opcional)
  UPDATE tasks 
  SET actual_start_date = NULL,
      predicted_end_date = NULL,
      actual_end_date = NULL,
      status = CASE 
        WHEN status IN ('completed', 'completed_delayed') THEN 'pending'
        ELSE status
      END
  WHERE project_id = target_project_id;
  
  RAISE NOTICE '🧹 Dados anteriores limpos';
  
  -- =====================================================
  -- CENÁRIO 1: Tarefa NO PRAZO (Concluída exatamente na data)
  -- =====================================================
  UPDATE tasks
  SET 
    status = 'completed',
    actual_start_date = start_date,  -- Iniciou no dia planejado
    predicted_end_date = end_date,   -- Previsto igual ao planejado
    actual_end_date = end_date       -- Concluiu no dia planejado
  WHERE project_id = target_project_id
    AND id = (
      SELECT id FROM tasks 
      WHERE project_id = target_project_id 
      ORDER BY "order" NULLS LAST, created_at 
      LIMIT 1 OFFSET 0
    );
  
  RAISE NOTICE '✅ Tarefa 1: NO PRAZO configurada';
  
  -- =====================================================
  -- CENÁRIO 2: Tarefa ADIANTADA (Concluída antes do prazo)
  -- =====================================================
  UPDATE tasks
  SET 
    status = 'completed',
    actual_start_date = start_date,
    predicted_end_date = end_date,
    actual_end_date = (end_date::date - INTERVAL '2 days')::date  -- Concluiu 2 dias antes
  WHERE project_id = target_project_id
    AND id = (
      SELECT id FROM tasks 
      WHERE project_id = target_project_id 
      ORDER BY "order" NULLS LAST, created_at 
      LIMIT 1 OFFSET 1
    );
  
  RAISE NOTICE '🎉 Tarefa 2: ADIANTADA configurada';
  
  -- =====================================================
  -- CENÁRIO 3: Tarefa CONCLUÍDA COM ATRASO
  -- =====================================================
  UPDATE tasks
  SET 
    status = 'completed_delayed',
    actual_start_date = (start_date::date + INTERVAL '1 day')::date,  -- Iniciou 1 dia depois
    predicted_end_date = (end_date::date + INTERVAL '3 days')::date,  -- Previsto atrasou
    actual_end_date = (end_date::date + INTERVAL '3 days')::date      -- Concluiu 3 dias depois
  WHERE project_id = target_project_id
    AND id = (
      SELECT id FROM tasks 
      WHERE project_id = target_project_id 
      ORDER BY "order" NULLS LAST, created_at 
      LIMIT 1 OFFSET 2
    );
  
  RAISE NOTICE '🔶 Tarefa 3: CONCLUÍDA COM ATRASO configurada';
  
  -- =====================================================
  -- CENÁRIO 4: Tarefa EM ATRASO (Ainda em andamento, passou do prazo)
  -- =====================================================
  UPDATE tasks
  SET 
    status = 'in_progress',
    actual_start_date = (start_date::date - INTERVAL '2 days')::date,  -- Iniciou antes
    predicted_end_date = (end_date::date + INTERVAL '2 days')::date,   -- Previsto atrasou
    actual_end_date = NULL  -- Ainda não concluiu
  WHERE project_id = target_project_id
    AND id = (
      SELECT id FROM tasks 
      WHERE project_id = target_project_id 
      ORDER BY "order" NULLS LAST, created_at 
      LIMIT 1 OFFSET 3
    );
  
  RAISE NOTICE '⚠️  Tarefa 4: EM ATRASO configurada';
  
  -- =====================================================
  -- CENÁRIO 5: Outra tarefa CONCLUÍDA COM ATRASO (para aumentar contador)
  -- =====================================================
  IF task_count >= 5 THEN
    UPDATE tasks
    SET 
      status = 'completed_delayed',
      actual_start_date = start_date,
      predicted_end_date = (end_date::date + INTERVAL '5 days')::date,
      actual_end_date = (end_date::date + INTERVAL '5 days')::date  -- 5 dias de atraso
    WHERE project_id = target_project_id
      AND id = (
        SELECT id FROM tasks 
        WHERE project_id = target_project_id 
        ORDER BY "order" NULLS LAST, created_at 
        LIMIT 1 OFFSET 4
      );
    
    RAISE NOTICE '🔶 Tarefa 5: CONCLUÍDA COM ATRASO configurada';
  END IF;
  
  -- =====================================================
  -- CENÁRIO 6: Mais uma tarefa NO PRAZO
  -- =====================================================
  IF task_count >= 6 THEN
    UPDATE tasks
    SET 
      status = 'completed',
      actual_start_date = start_date,
      predicted_end_date = end_date,
      actual_end_date = end_date
    WHERE project_id = target_project_id
      AND id = (
        SELECT id FROM tasks 
        WHERE project_id = target_project_id 
        ORDER BY "order" NULLS LAST, created_at 
        LIMIT 1 OFFSET 5
      );
    
    RAISE NOTICE '✅ Tarefa 6: NO PRAZO configurada';
  END IF;
  
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT 
  '📊 RESUMO DOS DADOS POPULADOS' as info,
  status,
  COUNT(*) as quantidade,
  COUNT(actual_start_date) as com_inicio_real,
  COUNT(predicted_end_date) as com_fim_previsto,
  COUNT(actual_end_date) as com_fim_real
FROM tasks 
WHERE project_id = 'dd13f521-e0d1-458b-aae3-2d2dff19e52f' -- ALTERE SE NECESSÁRIO
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'completed' THEN 1
    WHEN 'completed_delayed' THEN 2
    WHEN 'in_progress' THEN 3
    ELSE 4
  END;

-- Detalhamento por tarefa
SELECT 
  '📋 DETALHAMENTO POR TAREFA' as info,
  name as tarefa,
  status,
  start_date as planejado_inicio,
  end_date as planejado_fim,
  actual_start_date as real_inicio,
  predicted_end_date as previsto_fim,
  actual_end_date as real_fim,
  CASE 
    WHEN actual_end_date IS NOT NULL AND end_date IS NOT NULL THEN
      (actual_end_date::date - end_date::date)
    WHEN status = 'in_progress' AND end_date IS NOT NULL THEN
      (CURRENT_DATE - end_date::date)
    ELSE NULL
  END as desvio_dias
FROM tasks 
WHERE project_id = 'dd13f521-e0d1-458b-aae3-2d2dff19e52f' -- ALTERE SE NECESSÁRIO
  AND actual_start_date IS NOT NULL
ORDER BY "order" NULLS LAST, created_at;

-- =====================================================
-- RESULTADO ESPERADO NAS MÉTRICAS
-- =====================================================
SELECT 
  '🎯 MÉTRICAS ESPERADAS' as info,
  SUM(CASE WHEN status = 'completed' AND actual_end_date = end_date THEN 1 ELSE 0 END) as no_prazo,
  SUM(CASE WHEN status = 'completed_delayed' THEN 1 ELSE 0 END) as concluido_atrasado,
  SUM(CASE WHEN status = 'in_progress' AND end_date < CURRENT_DATE THEN 1 ELSE 0 END) as em_atraso,
  SUM(CASE WHEN status = 'completed' AND actual_end_date < end_date THEN 1 ELSE 0 END) as adiantadas,
  SUM(
    CASE 
      WHEN actual_end_date IS NOT NULL AND end_date IS NOT NULL THEN
        (actual_end_date::date - end_date::date)
      WHEN status = 'in_progress' AND end_date IS NOT NULL AND end_date < CURRENT_DATE THEN
        (CURRENT_DATE - end_date::date)
      ELSE 0
    END
  ) as desvio_total_dias
FROM tasks 
WHERE project_id = 'dd13f521-e0d1-458b-aae3-2d2dff19e52f'; -- ALTERE SE NECESSÁRIO

RAISE NOTICE '✅ Script executado com sucesso!';
RAISE NOTICE '🔍 Verifique os resultados acima';
RAISE NOTICE '🌐 Acesse o projeto no navegador para ver as métricas!';

