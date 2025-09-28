-- Script master para executar TODAS as correções de fatores
-- Baseado nas planilhas fornecidas pelo usuário

-- ========================================
-- EXECUTAR TODAS AS CORREÇÕES
-- ========================================

-- 1. VBA
\i scripts/042_fix_all_technologies.sql

-- 2. Access, Stored Procedures
\i scripts/043_fix_remaining_technologies.sql

-- 3. PowerShell, UIPATH
\i scripts/044_fix_final_technologies.sql

-- 4. AA, ARP, BP
\i scripts/045_fix_remaining_final_technologies.sql

-- 5. AutoIt, .NET, SQL
\i scripts/046_fix_last_technologies.sql

-- ========================================
-- VERIFICAÇÃO COMPLETA
-- ========================================

-- Verificar UIPATH > MB (problema específico reportado)
SELECT 
  'UIPATH > MB' as verificacao,
  t.nome as tecnologia,
  c.nivel as complexidade,
  f.fator_novo,
  f.fator_alteracao,
  ROUND(f.fator_novo / 1.4, 1) as novo_experiente,
  ROUND(f.fator_alteracao / 1.4, 1) as alteracao_experiente
FROM fatores_estimativa f
JOIN tecnologias t ON f.tecnologia_id = t.id
JOIN complexidades c ON f.complexidade_id = c.id
JOIN tipos_tarefa tt ON f.tipo_tarefa_id = tt.id
WHERE t.nome = 'UIPATH' AND c.codigo = 'MB' AND tt.nome = 'NOVO';

-- Verificar todas as tecnologias
SELECT 
  t.nome as tecnologia,
  COUNT(*) as total_fatores,
  MIN(f.fator_novo) as min_novo,
  MAX(f.fator_novo) as max_novo,
  MIN(f.fator_alteracao) as min_alteracao,
  MAX(f.fator_alteracao) as max_alteracao
FROM fatores_estimativa f
JOIN tecnologias t ON f.tecnologia_id = t.id
JOIN tipos_tarefa tt ON f.tipo_tarefa_id = tt.id
WHERE tt.nome = 'NOVO'
GROUP BY t.nome
ORDER BY t.nome;
