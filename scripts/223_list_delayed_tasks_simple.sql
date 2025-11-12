-- =====================================================
-- Script 223: Listar tarefas com atraso (simplificado)
-- =====================================================
-- Projeto ID: c1c8c44e-399f-40b1-bbc3-b6af8b7f3d60
-- Data: 2025-11-12
-- =====================================================

-- TAREFAS COM ATRASO (Desvio > 0)
SELECT 
  t.name AS "Tarefa",
  t.start_date AS "Início Plan",
  t.end_date AS "Fim Plan",
  t.actual_end_date AS "Fim Real",
  t.predicted_end_date AS "Fim Prev",
  t.status AS "Status",
  t.responsible AS "Responsável",
  
  -- DESVIO CALCULADO
  CASE
    WHEN t.actual_end_date IS NOT NULL THEN
      (DATE(t.actual_end_date) - DATE(t.end_date))
    WHEN t.predicted_end_date IS NOT NULL THEN
      (DATE(t.predicted_end_date) - DATE(t.end_date))
    ELSE 0
  END AS "Desvio (dias)",
  
  -- DATA USADA PARA CÁLCULO
  CASE
    WHEN t.actual_end_date IS NOT NULL THEN
      'Fim Real: ' || t.actual_end_date
    WHEN t.predicted_end_date IS NOT NULL THEN
      'Fim Previsto: ' || t.predicted_end_date
    ELSE 'Nenhuma data real/prevista'
  END AS "Base do Cálculo"
  
FROM tasks t
WHERE t.project_id = 'c1c8c44e-399f-40b1-bbc3-b6af8b7f3d60'
  -- FILTRAR: Mostrar apenas tarefas COM DESVIO
  AND (
    (t.actual_end_date IS NOT NULL AND DATE(t.actual_end_date) > DATE(t.end_date))
    OR
    (t.predicted_end_date IS NOT NULL AND DATE(t.predicted_end_date) > DATE(t.end_date))
  )
ORDER BY 
  -- Ordenar por MAIOR DESVIO primeiro
  CASE
    WHEN t.actual_end_date IS NOT NULL THEN
      (DATE(t.actual_end_date) - DATE(t.end_date))
    WHEN t.predicted_end_date IS NOT NULL THEN
      (DATE(t.predicted_end_date) - DATE(t.end_date))
    ELSE 0
  END DESC;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- A tarefa com MAIOR ATRASO aparece NO TOPO!
-- 
-- Exemplo:
-- Tarefa                | Desvio (dias) | Base do Cálculo
-- ---------------------|---------------|------------------
-- Desenvolvimento RPA  | +228          | Fim Previsto: 2024-12-15
-- Permissão Projuris   | +28           | Fim Real: 2024-03-21
-- Validação QA         | +5            | Fim Real: 2024-04-10
-- =====================================================

