-- Script seguro para corrigir TODOS os fatores
-- Usa UPDATE individual para cada combinação específica

-- UIPATH - MB (Muito Baixa)
UPDATE fatores_estimativa 
SET fator_novo = 3.64, fator_alteracao = 1.82
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'MB'
  AND tipos_tarefa.nome = 'NOVO';

-- UIPATH - MB+ (Muito Baixa+)
UPDATE fatores_estimativa 
SET fator_novo = 4.62, fator_alteracao = 3.08
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'MB+'
  AND tipos_tarefa.nome = 'NOVO';

-- UIPATH - B (Baixa)
UPDATE fatores_estimativa 
SET fator_novo = 7.7, fator_alteracao = 4.62
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'B'
  AND tipos_tarefa.nome = 'NOVO';

-- UIPATH - B+ (Baixa+)
UPDATE fatores_estimativa 
SET fator_novo = 9.24, fator_alteracao = 4.62
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'B+'
  AND tipos_tarefa.nome = 'NOVO';

-- UIPATH - M (Média)
UPDATE fatores_estimativa 
SET fator_novo = 15.4, fator_alteracao = 9.24
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'M'
  AND tipos_tarefa.nome = 'NOVO';

-- UIPATH - M+ (Média+)
UPDATE fatores_estimativa 
SET fator_novo = 18.48, fator_alteracao = 11.08
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'M+'
  AND tipos_tarefa.nome = 'NOVO';

-- UIPATH - A (Alta)
UPDATE fatores_estimativa 
SET fator_novo = 30.8, fator_alteracao = 18.48
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'A'
  AND tipos_tarefa.nome = 'NOVO';

-- UIPATH - A+ (Alta+)
UPDATE fatores_estimativa 
SET fator_novo = 36.96, fator_alteracao = 22.18
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'A+'
  AND tipos_tarefa.nome = 'NOVO';

-- UIPATH - MA (Muito Alta)
UPDATE fatores_estimativa 
SET fator_novo = 61.6, fator_alteracao = 36.96
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'MA'
  AND tipos_tarefa.nome = 'NOVO';

-- UIPATH - MA+ (Muito Alta+)
UPDATE fatores_estimativa 
SET fator_novo = 73.92, fator_alteracao = 44.35
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'UIPATH'
  AND complexidades.codigo = 'MA+'
  AND tipos_tarefa.nome = 'NOVO';

-- Verificar os resultados para UIPATH
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
