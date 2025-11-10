-- =====================================================
-- Script: 214_example_populate_custom_dates.sql
-- EXEMPLO PREENCHIDO: Como popular datas customizadas
-- =====================================================

-- =====================================================
-- PASSO 1: CONSULTAR TAREFAS DO PROJETO
-- =====================================================
-- Execute esta query primeiro para pegar os IDs:

SELECT 
  id,
  name as tarefa,
  start_date as inicio_planejado,
  end_date as fim_planejado,
  status,
  "order"
FROM tasks 
WHERE project_id = 'dd13f521-e0d1-458b-aae3-2d2dff19e52f' -- ⚠️ Seu ID de projeto
ORDER BY "order" NULLS LAST, created_at;

-- Exemplo de resultado:
/*
┌──────────────────────────────────────┬─────────────┬──────────────────┬────────────────┬─────────┐
│ id                                   │ tarefa      │ inicio_planejado │ fim_planejado  │ status  │
├──────────────────────────────────────┼─────────────┼──────────────────┼────────────────┼─────────┤
│ abc123...                            │ Definir     │ 2025-09-15       │ 2025-09-19     │ pending │
│ def456...                            │ Desenho     │ 2025-09-20       │ 2025-09-25     │ pending │
│ ghi789...                            │ Validação   │ 2025-09-26       │ 2025-09-30     │ pending │
└──────────────────────────────────────┴─────────────┴──────────────────┴────────────────┴─────────┘
*/

-- =====================================================
-- PASSO 2: ATUALIZAR COM DATAS CUSTOMIZADAS
-- =====================================================

-- TAREFA 1: "Definir" - NO PRAZO
-- Planejado: 15/09 → 19/09
-- Você quer: Iniciou 15/09, Terminou 19/09 (sem atraso)

UPDATE tasks
SET 
  status = 'completed',
  actual_start_date = '2025-09-15',    -- Iniciou no dia planejado
  predicted_end_date = '2025-09-19',   -- Previsto era 19/09
  actual_end_date = '2025-09-19'       -- Concluiu no dia planejado ✅
WHERE id = 'abc123-COLE-O-ID-REAL-AQUI';

-- Resultado: Aparecerá em "✓ No Prazo" (0 dias de desvio)

-- =====================================================

-- TAREFA 2: "Desenho" - ADIANTADA
-- Planejado: 20/09 → 25/09
-- Você quer: Iniciou 20/09, Terminou 23/09 (2 dias antes!)

UPDATE tasks
SET 
  status = 'completed',
  actual_start_date = '2025-09-20',
  predicted_end_date = '2025-09-25',
  actual_end_date = '2025-09-23'       -- Concluiu 2 dias ANTES 🎉
WHERE id = 'def456-COLE-O-ID-REAL-AQUI';

-- Resultado: Aparecerá em "↗ Adiantadas" (-2 dias de desvio)

-- =====================================================

-- TAREFA 3: "Validação" - CONCLUÍDA COM ATRASO
-- Planejado: 26/09 → 30/09
-- Você quer: Iniciou 26/09, Terminou 03/10 (3 dias depois!)

UPDATE tasks
SET 
  status = 'completed_delayed',
  actual_start_date = '2025-09-26',
  predicted_end_date = '2025-10-03',
  actual_end_date = '2025-10-03'       -- Concluiu 3 dias DEPOIS 🔶
WHERE id = 'ghi789-COLE-O-ID-REAL-AQUI';

-- Resultado: Aparecerá em "🔶 Concluído Atrasado" (+3 dias de desvio)

-- =====================================================
-- MAIS EXEMPLOS: COPIE E AJUSTE CONFORME NECESSÁRIO
-- =====================================================

-- Exemplo 4: Tarefa EM ATRASO (ainda não concluiu)
/*
UPDATE tasks
SET 
  status = 'in_progress',
  actual_start_date = '2025-10-01',
  predicted_end_date = '2025-10-08',
  actual_end_date = NULL               -- Ainda não concluiu!
WHERE id = 'xxx-COLE-ID-AQUI';
*/

-- Exemplo 5: Outra tarefa no prazo
/*
UPDATE tasks
SET 
  status = 'completed',
  actual_start_date = '2025-10-04',
  predicted_end_date = '2025-10-10',
  actual_end_date = '2025-10-10'
WHERE id = 'yyy-COLE-ID-AQUI';
*/

-- =====================================================
-- VERIFICAÇÃO: Execute depois das atualizações
-- =====================================================

SELECT 
  '✅ VERIFICAÇÃO' as info,
  name as tarefa,
  start_date as plan_inicio,
  end_date as plan_fim,
  actual_start_date as real_inicio,
  actual_end_date as real_fim,
  status,
  CASE 
    WHEN actual_end_date IS NOT NULL AND end_date IS NOT NULL THEN
      CONCAT(
        CASE 
          WHEN (actual_end_date::date - end_date::date) > 0 THEN '+'
          WHEN (actual_end_date::date - end_date::date) < 0 THEN ''
          ELSE ''
        END,
        (actual_end_date::date - end_date::date)::text,
        ' dias'
      )
    ELSE '-'
  END as desvio
FROM tasks 
WHERE project_id = 'dd13f521-e0d1-458b-aae3-2d2dff19e52f'
  AND actual_start_date IS NOT NULL
ORDER BY actual_start_date;

-- Exemplo de resultado esperado:
/*
┌──────────┬────────────┬──────────┬────────────┬──────────┬───────────────────┬─────────┐
│ tarefa   │ plan_inicio│ plan_fim │ real_inicio│ real_fim │ status            │ desvio  │
├──────────┼────────────┼──────────┼────────────┼──────────┼───────────────────┼─────────┤
│ Definir  │ 2025-09-15 │2025-09-19│ 2025-09-15 │2025-09-19│ completed         │ 0 dias  │
│ Desenho  │ 2025-09-20 │2025-09-25│ 2025-09-20 │2025-09-23│ completed         │ -2 dias │
│ Validação│ 2025-09-26 │2025-09-30│ 2025-09-26 │2025-10-03│ completed_delayed │ +3 dias │
└──────────┴────────────┴──────────┴────────────┴──────────┴───────────────────┴─────────┘
*/

-- =====================================================
-- 🎯 MÉTRICAS ESPERADAS NO CARD
-- =====================================================

SELECT 
  '🎯 MÉTRICAS NO CARD' as info,
  COUNT(*) FILTER (WHERE status = 'completed' AND actual_end_date = end_date) as "✓ No Prazo",
  COUNT(*) FILTER (WHERE status = 'completed_delayed') as "🔶 Concl. Atrasado",
  COUNT(*) FILTER (WHERE status = 'in_progress' AND end_date < CURRENT_DATE) as "⚠ Em Atraso",
  COUNT(*) FILTER (WHERE status = 'completed' AND actual_end_date < end_date) as "↗ Adiantadas",
  SUM(
    CASE 
      WHEN actual_end_date IS NOT NULL AND end_date IS NOT NULL THEN
        (actual_end_date::date - end_date::date)
      ELSE 0
    END
  ) as "📅 Desvio Total"
FROM tasks 
WHERE project_id = 'dd13f521-e0d1-458b-aae3-2d2dff19e52f'
  AND actual_start_date IS NOT NULL;

-- Exemplo de resultado esperado:
/*
┌──────────────┬──────────────────┬──────────┬──────────────┬──────────────┐
│ ✓ No Prazo   │ 🔶 Concl. Atraso│ ⚠ Em Atr│ ↗ Adiantadas │📅 Desvio Tot │
├──────────────┼──────────────────┼──────────┼──────────────┼──────────────┤
│      1       │        1         │    0     │      1       │    +1 dia    │
└──────────────┴──────────────────┴──────────┴──────────────┴──────────────┘
*/

