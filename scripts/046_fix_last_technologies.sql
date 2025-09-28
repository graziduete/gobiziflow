-- Script final para as últimas tecnologias
-- AutoIt, .NET, SQL

-- ========================================
-- AUTOIT - Fatores corrigidos
-- ========================================
UPDATE fatores_estimativa SET fator_novo = 2.8, fator_alteracao = 1.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AutoIt' AND complexidades.codigo = 'MB' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 4.2, fator_alteracao = 2.1
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AutoIt' AND complexidades.codigo = 'MB+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 5.6, fator_alteracao = 2.8
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AutoIt' AND complexidades.codigo = 'B' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 7.0, fator_alteracao = 3.5
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AutoIt' AND complexidades.codigo = 'B+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 11.2, fator_alteracao = 5.6
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AutoIt' AND complexidades.codigo = 'M' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 14.0, fator_alteracao = 7.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AutoIt' AND complexidades.codigo = 'M+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 22.4, fator_alteracao = 11.2
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AutoIt' AND complexidades.codigo = 'A' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 28.0, fator_alteracao = 14.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AutoIt' AND complexidades.codigo = 'A+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 44.8, fator_alteracao = 22.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AutoIt' AND complexidades.codigo = 'MA' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 56.0, fator_alteracao = 28.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AutoIt' AND complexidades.codigo = 'MA+' AND tipos_tarefa.nome = 'NOVO';

-- ========================================
-- .NET - Fatores corrigidos
-- ========================================
UPDATE fatores_estimativa SET fator_novo = 2.8, fator_alteracao = 1.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = '.NET' AND complexidades.codigo = 'MB' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 4.2, fator_alteracao = 2.1
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = '.NET' AND complexidades.codigo = 'MB+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 5.6, fator_alteracao = 2.8
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = '.NET' AND complexidades.codigo = 'B' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 7.0, fator_alteracao = 3.5
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = '.NET' AND complexidades.codigo = 'B+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 11.2, fator_alteracao = 5.6
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = '.NET' AND complexidades.codigo = 'M' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 14.0, fator_alteracao = 7.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = '.NET' AND complexidades.codigo = 'M+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 22.4, fator_alteracao = 11.2
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = '.NET' AND complexidades.codigo = 'A' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 28.0, fator_alteracao = 14.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = '.NET' AND complexidades.codigo = 'A+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 44.8, fator_alteracao = 22.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = '.NET' AND complexidades.codigo = 'MA' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 56.0, fator_alteracao = 28.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = '.NET' AND complexidades.codigo = 'MA+' AND tipos_tarefa.nome = 'NOVO';

-- ========================================
-- SQL - Fatores corrigidos
-- ========================================
UPDATE fatores_estimativa SET fator_novo = 2.8, fator_alteracao = 1.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'SQL' AND complexidades.codigo = 'MB' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 4.2, fator_alteracao = 2.1
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'SQL' AND complexidades.codigo = 'MB+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 5.6, fator_alteracao = 2.8
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'SQL' AND complexidades.codigo = 'B' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 7.0, fator_alteracao = 3.5
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'SQL' AND complexidades.codigo = 'B+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 11.2, fator_alteracao = 5.6
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'SQL' AND complexidades.codigo = 'M' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 14.0, fator_alteracao = 7.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'SQL' AND complexidades.codigo = 'M+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 22.4, fator_alteracao = 11.2
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'SQL' AND complexidades.codigo = 'A' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 28.0, fator_alteracao = 14.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'SQL' AND complexidades.codigo = 'A+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 44.8, fator_alteracao = 22.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'SQL' AND complexidades.codigo = 'MA' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 56.0, fator_alteracao = 28.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'SQL' AND complexidades.codigo = 'MA+' AND tipos_tarefa.nome = 'NOVO';

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
-- Verificar UIPATH especificamente (o problema reportado)
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
