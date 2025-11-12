-- =====================================================
-- Script 222: Identificar tarefas com atraso
-- =====================================================
-- Projeto ID: c1c8c44e-399f-40b1-bbc3-b6af8b7f3d60
-- Data: 2025-11-12
-- =====================================================

-- Buscar TODAS as tarefas desse projeto com cálculo de desvio
SELECT 
  t.id,
  t.name AS "Nome da Tarefa",
  t.start_date AS "Início Planejado",
  t.end_date AS "Fim Planejado",
  t.actual_start_date AS "Início Real",
  t.actual_end_date AS "Fim Real",
  t.predicted_end_date AS "Fim Previsto",
  t.status AS "Status",
  t.responsible AS "Responsável",
  
  -- CALCULAR DESVIO (em dias)
  CASE
    -- Se já terminou (tem actual_end_date)
    WHEN t.actual_end_date IS NOT NULL THEN
      (DATE(t.actual_end_date) - DATE(t.end_date))
    
    -- Se está em andamento (tem predicted_end_date)
    WHEN t.predicted_end_date IS NOT NULL THEN
      (DATE(t.predicted_end_date) - DATE(t.end_date))
    
    -- Se não tem nenhuma data real/prevista
    ELSE
      0
  END AS "Desvio (dias)",
  
  -- IDENTIFICAR SE ESTÁ ATRASADO
  CASE
    WHEN t.actual_end_date IS NOT NULL AND DATE(t.actual_end_date) > DATE(t.end_date) THEN
      '🔴 ATRASADO (Concluído com atraso)'
    WHEN t.predicted_end_date IS NOT NULL AND DATE(t.predicted_end_date) > DATE(t.end_date) THEN
      '🟡 ATRASANDO (Previsão ultrapassa planejado)'
    WHEN t.actual_end_date IS NOT NULL AND DATE(t.actual_end_date) <= DATE(t.end_date) THEN
      '🟢 NO PRAZO (Concluído dentro do planejado)'
    WHEN t.predicted_end_date IS NOT NULL AND DATE(t.predicted_end_date) <= DATE(t.end_date) THEN
      '🟢 NO PRAZO (Previsão dentro do planejado)'
    ELSE
      '⚪ SEM PREVISÃO'
  END AS "Situação"
  
FROM tasks t
WHERE t.project_id = 'c1c8c44e-399f-40b1-bbc3-b6af8b7f3d60'
ORDER BY 
  -- Ordenar por desvio (maior atraso primeiro)
  CASE
    WHEN t.actual_end_date IS NOT NULL THEN
      (DATE(t.actual_end_date) - DATE(t.end_date))
    WHEN t.predicted_end_date IS NOT NULL THEN
      (DATE(t.predicted_end_date) - DATE(t.end_date))
    ELSE 0
  END DESC;

-- =====================================================
-- RESUMO DO PROJETO
-- =====================================================

SELECT 
  p.name AS "Nome do Projeto",
  COUNT(t.id) AS "Total de Tarefas",
  
  -- Tarefas atrasadas (concluídas com atraso)
  COUNT(CASE 
    WHEN t.actual_end_date IS NOT NULL 
    AND DATE(t.actual_end_date) > DATE(t.end_date) 
    THEN 1 
  END) AS "Concluídas com Atraso",
  
  -- Tarefas que VÃO atrasar (previsão ultrapassa)
  COUNT(CASE 
    WHEN t.actual_end_date IS NULL
    AND t.predicted_end_date IS NOT NULL 
    AND DATE(t.predicted_end_date) > DATE(t.end_date) 
    THEN 1 
  END) AS "Previstas para Atrasar",
  
  -- Tarefas no prazo
  COUNT(CASE 
    WHEN (t.actual_end_date IS NOT NULL AND DATE(t.actual_end_date) <= DATE(t.end_date))
    OR (t.predicted_end_date IS NOT NULL AND DATE(t.predicted_end_date) <= DATE(t.end_date))
    THEN 1 
  END) AS "No Prazo",
  
  -- Maior desvio individual
  MAX(
    CASE
      WHEN t.actual_end_date IS NOT NULL THEN
        (DATE(t.actual_end_date) - DATE(t.end_date))
      WHEN t.predicted_end_date IS NOT NULL THEN
        (DATE(t.predicted_end_date) - DATE(t.end_date))
      ELSE 0
    END
  ) AS "Maior Desvio (dias)"
  
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
WHERE p.id = 'c1c8c44e-399f-40b1-bbc3-b6af8b7f3d60'
GROUP BY p.id, p.name;

-- =====================================================
-- DICA:
-- =====================================================
-- Execute a primeira query para ver TODAS as tarefas
-- ordenadas por desvio (maior atraso no topo)
-- 
-- Execute a segunda query para ver um RESUMO geral
-- =====================================================

