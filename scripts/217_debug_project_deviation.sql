-- =====================================================
-- Script: 217_debug_project_deviation.sql
-- Descrição: Investigar desvio de 348 dias no projeto
-- Data: 2025-11-10
-- Projeto: 8edee7ff-ff9d-42fc-9bdc-3ae64ed176d6
-- =====================================================

-- 1. Ver TODAS as tarefas e seus desvios detalhados
SELECT 
  name as tarefa,
  status,
  start_date as inicio_plan,
  end_date as fim_plan,
  actual_start_date as inicio_real,
  actual_end_date as fim_real,
  predicted_end_date as fim_previsto,
  CASE 
    WHEN actual_end_date IS NOT NULL AND end_date IS NOT NULL THEN
      (actual_end_date::date - end_date::date)
    WHEN status IN ('in_progress', 'delayed') AND end_date IS NOT NULL AND end_date < CURRENT_DATE THEN
      (CURRENT_DATE - end_date::date)
    ELSE 0
  END as desvio_dias
FROM tasks 
WHERE project_id = '8edee7ff-ff9d-42fc-9bdc-3ae64ed176d6'
ORDER BY desvio_dias DESC;

-- 2. Soma total de desvios (como o card calcula)
SELECT 
  '📊 RESUMO TOTAL' as info,
  COUNT(*) FILTER (WHERE actual_end_date IS NOT NULL OR status IN ('in_progress', 'delayed')) as tarefas_analisadas,
  SUM(
    CASE 
      WHEN actual_end_date IS NOT NULL AND end_date IS NOT NULL THEN
        (actual_end_date::date - end_date::date)
      WHEN status IN ('in_progress', 'delayed') AND end_date IS NOT NULL AND end_date < CURRENT_DATE THEN
        (CURRENT_DATE - end_date::date)
      ELSE 0
    END
  ) as desvio_total_dias
FROM tasks 
WHERE project_id = '8edee7ff-ff9d-42fc-9bdc-3ae64ed176d6';

-- 3. Detalhes das tarefas com maior desvio
SELECT 
  '🚨 TAREFAS COM MAIOR DESVIO' as info,
  name as tarefa,
  status,
  end_date as planejado,
  COALESCE(actual_end_date::text, CURRENT_DATE::text) as real_ou_hoje,
  CASE 
    WHEN actual_end_date IS NOT NULL THEN
      (actual_end_date::date - end_date::date)
    WHEN status IN ('in_progress', 'delayed') AND end_date < CURRENT_DATE THEN
      (CURRENT_DATE - end_date::date)
    ELSE 0
  END as desvio,
  CASE 
    WHEN actual_end_date IS NOT NULL THEN 'Concluída'
    WHEN status IN ('in_progress', 'delayed') THEN 'Em Andamento/Atrasada'
    ELSE 'Pendente'
  END as situacao
FROM tasks 
WHERE project_id = '8edee7ff-ff9d-42fc-9bdc-3ae64ed176d6'
  AND (
    (actual_end_date IS NOT NULL AND end_date IS NOT NULL)
    OR
    (status IN ('in_progress', 'delayed') AND end_date IS NOT NULL AND end_date < CURRENT_DATE)
  )
ORDER BY desvio DESC
LIMIT 10;

-- 4. Verificar se há tarefas com datas muito antigas
SELECT 
  '⚠️ POSSÍVEL PROBLEMA' as alerta,
  name as tarefa,
  end_date as data_fim_planejada,
  actual_end_date as data_fim_real,
  (CURRENT_DATE - end_date::date) as dias_desde_planejado,
  status
FROM tasks 
WHERE project_id = '8edee7ff-ff9d-42fc-9bdc-3ae64ed176d6'
  AND end_date IS NOT NULL
  AND end_date < '2024-12-01'  -- Datas muito antigas (mais de 1 ano)
ORDER BY end_date;

