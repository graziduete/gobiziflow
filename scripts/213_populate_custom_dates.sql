-- =====================================================
-- Script: 213_populate_custom_dates.sql
-- Descrição: Popular datas CUSTOMIZADAS para tarefas específicas
-- Data: 2025-11-10
-- Objetivo: Permitir definir datas exatas manualmente
-- =====================================================

-- ⚠️ INSTRUÇÕES:
-- 1. Pegue os IDs das tarefas que quer atualizar
-- 2. Defina as datas que quer para cada tarefa
-- 3. Execute o script

-- =====================================================
-- PASSO 1: CONSULTAR TAREFAS DO PROJETO
-- =====================================================
-- Primeiro, veja as tarefas disponíveis:

SELECT 
  id,
  name as tarefa,
  start_date as inicio_planejado,
  end_date as fim_planejado,
  status,
  "order"
FROM tasks 
WHERE project_id = 'SEU_PROJECT_ID_AQUI' -- ⚠️ ALTERE AQUI!
ORDER BY "order" NULLS LAST, created_at;

-- Copie os IDs das tarefas acima e use abaixo

-- =====================================================
-- PASSO 2: ATUALIZAR TAREFA 1
-- =====================================================
-- Exemplo: Tarefa concluída NO PRAZO
-- Planejado: 15/09 → 19/09
-- Real: 15/09 → 19/09 (sem desvio)

UPDATE tasks
SET 
  status = 'completed',
  actual_start_date = '2025-09-15',    -- Data início REAL
  predicted_end_date = '2025-09-19',   -- Data fim PREVISTA
  actual_end_date = '2025-09-19'       -- Data fim REAL
WHERE id = 'ID_DA_TAREFA_1_AQUI'; -- ⚠️ COLE O ID DA TAREFA!

-- =====================================================
-- PASSO 3: ATUALIZAR TAREFA 2
-- =====================================================
-- Exemplo: Tarefa ADIANTADA
-- Planejado: 20/09 → 25/09
-- Real: Concluiu em 23/09 (2 dias antes)

UPDATE tasks
SET 
  status = 'completed',
  actual_start_date = '2025-09-20',
  predicted_end_date = '2025-09-25',
  actual_end_date = '2025-09-23'       -- Concluiu ANTES
WHERE id = 'ID_DA_TAREFA_2_AQUI'; -- ⚠️ COLE O ID DA TAREFA!

-- =====================================================
-- PASSO 4: ATUALIZAR TAREFA 3
-- =====================================================
-- Exemplo: Tarefa CONCLUÍDA COM ATRASO
-- Planejado: 26/09 → 30/09
-- Real: Concluiu em 03/10 (3 dias depois)

UPDATE tasks
SET 
  status = 'completed_delayed',
  actual_start_date = '2025-09-26',
  predicted_end_date = '2025-10-03',
  actual_end_date = '2025-10-03'       -- Concluiu DEPOIS
WHERE id = 'ID_DA_TAREFA_3_AQUI'; -- ⚠️ COLE O ID DA TAREFA!

-- =====================================================
-- PASSO 5: ATUALIZAR TAREFA 4
-- =====================================================
-- Exemplo: Tarefa EM ATRASO (ainda não concluiu)
-- Planejado: 01/10 → 05/10
-- Real: Iniciou em 01/10, ainda em andamento, já passou do prazo

UPDATE tasks
SET 
  status = 'in_progress',
  actual_start_date = '2025-10-01',
  predicted_end_date = '2025-10-08',   -- Previsto atrasou
  actual_end_date = NULL               -- Ainda NÃO concluiu
WHERE id = 'ID_DA_TAREFA_4_AQUI'; -- ⚠️ COLE O ID DA TAREFA!

-- =====================================================
-- PASSO 6: MAIS TAREFAS (COPIE E AJUSTE)
-- =====================================================
-- Template para copiar:

/*
UPDATE tasks
SET 
  status = 'completed',  -- ou 'completed_delayed', 'in_progress'
  actual_start_date = '2025-XX-XX',
  predicted_end_date = '2025-XX-XX',
  actual_end_date = '2025-XX-XX'  -- ou NULL se ainda não concluiu
WHERE id = 'ID_DA_TAREFA_AQUI';
*/

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT 
  '📊 RESULTADO FINAL' as info,
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
    WHEN status = 'in_progress' AND end_date IS NOT NULL AND end_date < CURRENT_DATE THEN
      (CURRENT_DATE - end_date::date)
    ELSE NULL
  END as desvio_dias
FROM tasks 
WHERE project_id = 'SEU_PROJECT_ID_AQUI' -- ⚠️ ALTERE AQUI!
  AND actual_start_date IS NOT NULL
ORDER BY "order" NULLS LAST, created_at;

-- =====================================================
-- 🎯 RESUMO DAS MÉTRICAS
-- =====================================================
SELECT 
  '🎯 MÉTRICAS' as info,
  COUNT(*) FILTER (WHERE status = 'completed' AND actual_end_date = end_date) as no_prazo,
  COUNT(*) FILTER (WHERE status = 'completed_delayed') as concluido_atrasado,
  COUNT(*) FILTER (WHERE status = 'in_progress' AND end_date < CURRENT_DATE) as em_atraso,
  COUNT(*) FILTER (WHERE status = 'completed' AND actual_end_date < end_date) as adiantadas,
  SUM(
    CASE 
      WHEN actual_end_date IS NOT NULL AND end_date IS NOT NULL THEN
        (actual_end_date::date - end_date::date)
      WHEN status = 'in_progress' AND end_date < CURRENT_DATE THEN
        (CURRENT_DATE - end_date::date)
      ELSE 0
    END
  ) as desvio_total_dias
FROM tasks 
WHERE project_id = 'SEU_PROJECT_ID_AQUI'; -- ⚠️ ALTERE AQUI!

