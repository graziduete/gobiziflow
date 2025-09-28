-- Corrigir valor de UIPATH > Média para 16.38 (conforme planilha)

-- Verificar valor atual
SELECT 
  t.nome as tecnologia,
  c.codigo as complexidade,
  c.nome as descricao_complexidade,
  f.fator_novo,
  f.fator_alteracao
FROM fatores_estimativa f
JOIN tecnologias t ON f.tecnologia_id = t.id
JOIN complexidades c ON f.complexidade_id = c.id
JOIN tipos_tarefa tt ON f.tipo_tarefa_id = tt.id
WHERE t.nome = 'UIPATH' AND c.codigo = 'M' AND tt.nome = 'NOVO';

-- Corrigir UIPATH > Média para 16.38
UPDATE fatores_estimativa 
SET fator_novo = 16.38, fator_alteracao = 9.1
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'M'
  AND tipos_tarefa.nome = 'NOVO';

-- Verificar resultado
SELECT 
  t.nome as tecnologia,
  c.codigo as complexidade,
  c.nome as descricao_complexidade,
  f.fator_novo,
  f.fator_alteracao
FROM fatores_estimativa f
JOIN tecnologias t ON f.tecnologia_id = t.id
JOIN complexidades c ON f.complexidade_id = c.id
JOIN tipos_tarefa tt ON f.tipo_tarefa_id = tt.id
WHERE t.nome = 'UIPATH' AND c.codigo = 'M' AND tt.nome = 'NOVO';
