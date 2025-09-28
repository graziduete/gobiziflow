-- Script seguro para corrigir os fatores de UIPATH especificamente
-- Foca apenas no problema reportado: UIPATH > Muito Baixa = 2.6

-- Primeiro, vamos verificar os dados atuais
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

-- Corrigir apenas UIPATH - MB (Muito Baixa) para NOVO
UPDATE fatores_estimativa 
SET fator_novo = 3.64
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'MB'
  AND tipos_tarefa.nome = 'NOVO';

-- Corrigir apenas UIPATH - MB (Muito Baixa) para ALTERACAO
UPDATE fatores_estimativa 
SET fator_alteracao = 1.82
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'MB'
  AND tipos_tarefa.nome = 'NOVO';

-- Verificar o resultado
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
WHERE t.nome = 'UIPATH' AND c.codigo = 'MB'
ORDER BY c.ordem;
