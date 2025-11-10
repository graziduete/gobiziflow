-- =====================================================
-- Script 218: Adicionar Datas Reais ao Nível do Projeto
-- =====================================================
-- Criado em: 2024-11-10
-- Objetivo: Adicionar campos actual_start_date e actual_end_date
--           na tabela projects para registrar as datas reais
--           do projeto (nível macro)
--
-- Diferença:
-- - projects.start_date / end_date = Planejado (baseline)
-- - projects.actual_start_date / actual_end_date = Real (o que aconteceu/vai acontecer)
-- - tasks.actual_start_date / actual_end_date = Real de cada tarefa (nível micro)
-- =====================================================

-- 1️⃣ Adicionar coluna actual_start_date (Data Início Real do Projeto)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS actual_start_date DATE;

-- 2️⃣ Adicionar coluna actual_end_date (Data Término Real do Projeto)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS actual_end_date DATE;

-- 3️⃣ Adicionar comentários explicativos
COMMENT ON COLUMN projects.start_date IS 'Data de início PLANEJADA do projeto (baseline inicial)';
COMMENT ON COLUMN projects.end_date IS 'Data de término PLANEJADA do projeto (baseline inicial)';
COMMENT ON COLUMN projects.actual_start_date IS 'Data de início REAL do projeto (quando realmente começou ou vai começar)';
COMMENT ON COLUMN projects.actual_end_date IS 'Data de término REAL do projeto (prazo real acordado/realizado)';

-- 4️⃣ Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_actual_start_date ON projects(actual_start_date);
CREATE INDEX IF NOT EXISTS idx_projects_actual_end_date ON projects(actual_end_date);

-- 5️⃣ Verificar estrutura
SELECT 
  column_name as "📋 Campo",
  data_type as "Tipo",
  CASE 
    WHEN is_nullable = 'YES' THEN '✅ Opcional'
    ELSE '❌ Obrigatório'
  END as "Nullable",
  CASE 
    WHEN column_name IN ('start_date', 'end_date') THEN '📅 PLANEJADO (Baseline)'
    WHEN column_name IN ('actual_start_date', 'actual_end_date') THEN '✅ REAL (Acordado/Realizado)'
    ELSE '-'
  END as "Descrição"
FROM information_schema.columns
WHERE table_name = 'projects'
  AND column_name IN ('start_date', 'end_date', 'actual_start_date', 'actual_end_date')
ORDER BY 
  CASE column_name
    WHEN 'start_date' THEN 1
    WHEN 'actual_start_date' THEN 2
    WHEN 'end_date' THEN 3
    WHEN 'actual_end_date' THEN 4
  END;

-- 6️⃣ Estatísticas de uso
SELECT 
  COUNT(*) as "Total de Projetos",
  COUNT(start_date) as "Com Data Início Planejada",
  COUNT(actual_start_date) as "Com Data Início Real",
  COUNT(end_date) as "Com Data Término Planejada",
  COUNT(actual_end_date) as "Com Data Término Real",
  ROUND(COUNT(actual_start_date)::numeric / NULLIF(COUNT(*), 0) * 100, 1) || '%' as "% Com Início Real",
  ROUND(COUNT(actual_end_date)::numeric / NULLIF(COUNT(*), 0) * 100, 1) || '%' as "% Com Término Real"
FROM projects;

-- 7️⃣ Exemplo de uso: Projetos com desvio de prazo
SELECT 
  name as "Projeto",
  start_date as "Início Planejado",
  actual_start_date as "Início Real",
  end_date as "Término Planejado",
  actual_end_date as "Término Real",
  CASE 
    WHEN actual_end_date IS NOT NULL AND end_date IS NOT NULL THEN
      (actual_end_date::date - end_date::date) || ' dias'
    ELSE 'N/A'
  END as "Desvio de Prazo"
FROM projects
WHERE actual_start_date IS NOT NULL 
   OR actual_end_date IS NOT NULL
ORDER BY 
  CASE 
    WHEN actual_end_date IS NOT NULL AND end_date IS NOT NULL THEN
      (actual_end_date::date - end_date::date)
    ELSE 0
  END DESC
LIMIT 10;

-- ✅ Script concluído!
-- 
-- 💡 Uso Recomendado:
-- 
-- 1. Início Planejado vs Real:
--    - start_date: "Quando planejamos começar"
--    - actual_start_date: "Quando realmente começamos"
--
-- 2. Término Planejado vs Real:
--    - end_date: "Quando planejamos terminar"
--    - actual_end_date: "Quando vamos/terminamos de verdade"
--
-- 3. Exemplo RPA Projuris:
--    - end_date: 2024-03-27 (baseline)
--    - actual_end_date: 2024-12-15 (acordo com desenvolvedor)
--    - Desvio: +263 dias
--
-- Isso permite comunicar ao cliente de forma clara!

