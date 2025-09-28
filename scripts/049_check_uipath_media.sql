-- Verificar valores de UIPATH > Média no banco
SELECT 
  t.nome as tecnologia,
  c.codigo as complexidade,
  c.nome as descricao_complexidade,
  tt.nome as tipo_tarefa,
  f.fator_novo,
  f.fator_alteracao,
  f.balizador,
  ROUND(f.fator_novo / f.balizador, 1) as novo_experiente,
  ROUND(f.fator_alteracao / f.balizador, 1) as alteracao_experiente
FROM fatores_estimativa f
JOIN tecnologias t ON f.tecnologia_id = t.id
JOIN complexidades c ON f.complexidade_id = c.id
JOIN tipos_tarefa tt ON f.tipo_tarefa_id = tt.id
WHERE t.nome = 'UIPATH' AND c.codigo = 'M' AND tt.nome = 'NOVO';

-- Verificar todos os valores de UIPATH para comparação
SELECT 
  t.nome as tecnologia,
  c.codigo as complexidade,
  c.nome as descricao_complexidade,
  tt.nome as tipo_tarefa,
  f.fator_novo,
  f.fator_alteracao,
  f.balizador,
  ROUND(f.fator_novo / f.balizador, 1) as novo_experiente,
  ROUND(f.fator_alteracao / f.balizador, 1) as alteracao_experiente
FROM fatores_estimativa f
JOIN tecnologias t ON f.tecnologia_id = t.id
JOIN complexidades c ON f.complexidade_id = c.id
JOIN tipos_tarefa tt ON f.tipo_tarefa_id = tt.id
WHERE t.nome = 'UIPATH' AND tt.nome = 'NOVO'
ORDER BY c.ordem;
