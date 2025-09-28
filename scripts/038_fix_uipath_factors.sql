-- Script para corrigir os fatores de UIPATH baseado na planilha fornecida
-- UIPATH > Muito Baixa (MB): Novo 3.64, Alteração 1.82

-- Atualizar fatores de UIPATH para NOVO
UPDATE fatores_estimativa 
SET fator_novo = CASE complexidades.codigo
  WHEN 'MB' THEN 3.64
  WHEN 'MB+' THEN 4.62
  WHEN 'B' THEN 7.7
  WHEN 'B+' THEN 9.24
  WHEN 'M' THEN 15.4
  WHEN 'M+' THEN 18.48
  WHEN 'A' THEN 30.8
  WHEN 'A+' THEN 36.96
  WHEN 'MA' THEN 61.6
  WHEN 'MA+' THEN 73.92
END
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND tipos_tarefa.nome = 'NOVO';

-- Atualizar fatores de UIPATH para ALTERACAO
UPDATE fatores_estimativa 
SET fator_alteracao = CASE complexidades.codigo
  WHEN 'MB' THEN 1.82
  WHEN 'MB+' THEN 3.08
  WHEN 'B' THEN 4.62
  WHEN 'B+' THEN 4.62
  WHEN 'M' THEN 9.24
  WHEN 'M+' THEN 11.08
  WHEN 'A' THEN 18.48
  WHEN 'A+' THEN 22.18
  WHEN 'MA' THEN 36.96
  WHEN 'MA+' THEN 44.35
END
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND tipos_tarefa.nome = 'NOVO';

-- Verificar os resultados
SELECT 
  t.nome as tecnologia,
  c.nivel as complexidade,
  c.descricao,
  tt.nome as tipo_tarefa,
  f.fator_novo,
  f.fator_alteracao,
  ROUND(f.fator_novo / 1.4, 1) as novo_experiente,
  ROUND(f.fator_alteracao / 1.4, 1) as alteracao_experiente
FROM fatores_estimativa f
JOIN tecnologias t ON f.tecnologia_id = t.id
JOIN complexidades c ON f.complexidade_id = c.id
JOIN tipos_tarefa tt ON f.tipo_tarefa_id = tt.id
WHERE t.nome = 'UIPATH'
ORDER BY c.ordem;
