-- =====================================================
-- Script 219: Adicionar Datas Previstas ao Projeto
-- =====================================================
-- Criado em: 2024-11-10
-- Objetivo: Adicionar campos predicted_start_date e predicted_end_date
--           para registrar projeções atuais do projeto
--
-- ESTRUTURA COMPLETA DE DATAS:
-- 
-- 📋 PLANEJADO (Baseline - não muda):
--    - start_date: Data início planejada
--    - end_date: Data término planejada
--
-- 🔮 PREVISTO (Projeção atual - muda conforme realidade):
--    - predicted_start_date: Previsão atual de início
--    - predicted_end_date: Previsão atual de término
--
-- ✅ REALIZADO (O que aconteceu - definitivo):
--    - actual_start_date: Quando realmente começou
--    - actual_end_date: Quando realmente terminou
--
-- EXEMPLO RPA Projuris:
-- Planejado: 14/02 - 27/03 (42 dias)
-- Previsto: 14/02 - 15/12 (306 dias) ← Cliente pergunta "quando termina?"
-- Realizado: 14/02 - 20/12 (311 dias) ← O que realmente aconteceu
-- =====================================================

-- 1️⃣ Adicionar coluna predicted_start_date
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS predicted_start_date DATE;

-- 2️⃣ Adicionar coluna predicted_end_date
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS predicted_end_date DATE;

-- 3️⃣ Adicionar comentários explicativos em TODAS as colunas de datas
COMMENT ON COLUMN projects.start_date IS '📋 Data de início PLANEJADA (baseline inicial - não muda)';
COMMENT ON COLUMN projects.end_date IS '📋 Data de término PLANEJADA (baseline inicial - não muda)';
COMMENT ON COLUMN projects.predicted_start_date IS '🔮 Data de início PREVISTA (projeção atual - pode ser atualizada)';
COMMENT ON COLUMN projects.predicted_end_date IS '🔮 Data de término PREVISTA (projeção atual - pode ser atualizada)';
COMMENT ON COLUMN projects.actual_start_date IS '✅ Data de início REAL (quando realmente começou - definitivo)';
COMMENT ON COLUMN projects.actual_end_date IS '✅ Data de término REAL (quando realmente terminou - definitivo)';

-- 4️⃣ Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_predicted_start_date ON projects(predicted_start_date);
CREATE INDEX IF NOT EXISTS idx_projects_predicted_end_date ON projects(predicted_end_date);

-- 5️⃣ Verificar estrutura completa
SELECT 
  column_name as "📋 Campo",
  data_type as "Tipo",
  CASE 
    WHEN is_nullable = 'YES' THEN '✅ Opcional'
    ELSE '❌ Obrigatório'
  END as "Nullable",
  CASE 
    WHEN column_name IN ('start_date', 'end_date') THEN '📋 PLANEJADO (Baseline)'
    WHEN column_name IN ('predicted_start_date', 'predicted_end_date') THEN '🔮 PREVISTO (Projeção Atual)'
    WHEN column_name IN ('actual_start_date', 'actual_end_date') THEN '✅ REALIZADO (Definitivo)'
    ELSE '-'
  END as "📊 Tipo de Data"
FROM information_schema.columns
WHERE table_name = 'projects'
  AND column_name IN (
    'start_date', 'end_date',
    'predicted_start_date', 'predicted_end_date',
    'actual_start_date', 'actual_end_date'
  )
ORDER BY 
  CASE column_name
    WHEN 'start_date' THEN 1
    WHEN 'predicted_start_date' THEN 2
    WHEN 'actual_start_date' THEN 3
    WHEN 'end_date' THEN 4
    WHEN 'predicted_end_date' THEN 5
    WHEN 'actual_end_date' THEN 6
  END;

-- 6️⃣ Estatísticas de uso
SELECT 
  COUNT(*) as "Total de Projetos",
  COUNT(start_date) as "📋 Com Início Planejado",
  COUNT(predicted_start_date) as "🔮 Com Início Previsto",
  COUNT(actual_start_date) as "✅ Com Início Real",
  COUNT(end_date) as "📋 Com Término Planejado",
  COUNT(predicted_end_date) as "🔮 Com Término Previsto",
  COUNT(actual_end_date) as "✅ Com Término Real"
FROM projects;

-- 7️⃣ Exemplo: Projetos com diferença entre Previsto e Planejado
SELECT 
  name as "Projeto",
  end_date as "📋 Término Planejado",
  predicted_end_date as "🔮 Término Previsto",
  actual_end_date as "✅ Término Real",
  CASE 
    WHEN predicted_end_date IS NOT NULL AND end_date IS NOT NULL THEN
      CASE
        WHEN (predicted_end_date::date - end_date::date) > 0 THEN 
          '+' || (predicted_end_date::date - end_date::date)::text || ' dias'
        WHEN (predicted_end_date::date - end_date::date) < 0 THEN
          (predicted_end_date::date - end_date::date)::text || ' dias'
        ELSE 'No prazo'
      END
    ELSE 'N/A'
  END as "📊 Desvio Planejado→Previsto",
  CASE 
    WHEN actual_end_date IS NOT NULL AND predicted_end_date IS NOT NULL THEN
      CASE
        WHEN (actual_end_date::date - predicted_end_date::date) > 0 THEN 
          '+' || (actual_end_date::date - predicted_end_date::date)::text || ' dias'
        WHEN (actual_end_date::date - predicted_end_date::date) < 0 THEN
          (actual_end_date::date - predicted_end_date::date)::text || ' dias'
        ELSE 'Exato'
      END
    ELSE 'Em andamento'
  END as "🎯 Desvio Previsto→Real"
FROM projects
WHERE predicted_end_date IS NOT NULL 
   OR actual_end_date IS NOT NULL
ORDER BY 
  CASE 
    WHEN predicted_end_date IS NOT NULL AND end_date IS NOT NULL THEN
      (predicted_end_date::date - end_date::date)
    ELSE 0
  END DESC
LIMIT 10;

-- ✅ Script concluído!
-- 
-- 💡 USO RECOMENDADO:
-- 
-- 📋 PLANEJADO: Defina no início do projeto (baseline)
-- 🔮 PREVISTO: Atualize sempre que houver mudança na projeção
-- ✅ REALIZADO: Preencha apenas quando realmente acontecer
--
-- 📊 EXEMPLO DE FLUXO:
-- 
-- Janeiro (Planejamento):
--   start_date: 2024-02-14
--   end_date: 2024-03-27
--
-- Março (Revisão 1):
--   predicted_end_date: 2024-06-15 (+80 dias)
--
-- Julho (Revisão 2):
--   predicted_end_date: 2024-09-30 (+107 dias)
--
-- Novembro (Revisão 3):
--   predicted_end_date: 2024-12-15 (+76 dias)
--
-- Dezembro (Conclusão):
--   actual_start_date: 2024-02-14 (confirmado)
--   actual_end_date: 2024-12-20 (+5 dias do previsto)
--
-- MÉTRICAS FINAIS:
--   Planejado: 42 dias
--   Previsto (última): 306 dias (+264 dias vs planejado)
--   Realizado: 311 dias (+269 dias vs planejado, +5 dias vs previsto)
--   Precisão da última previsão: 98.4% ✅

