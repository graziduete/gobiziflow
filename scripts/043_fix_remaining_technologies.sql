-- Continuação do script para corrigir TODOS os fatores
-- Access, Stored Procedures, PowerShell, UIPATH, AA, ARP, BP, AutoIt, .NET, SQL

-- ========================================
-- ACCESS - Fatores corrigidos
-- ========================================
UPDATE fatores_estimativa SET fator_novo = 2.8, fator_alteracao = 1.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Access' AND complexidades.codigo = 'MB' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 4.2, fator_alteracao = 2.1
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Access' AND complexidades.codigo = 'MB+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 5.6, fator_alteracao = 2.8
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Access' AND complexidades.codigo = 'B' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 7.0, fator_alteracao = 3.5
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Access' AND complexidades.codigo = 'B+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 11.2, fator_alteracao = 5.6
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Access' AND complexidades.codigo = 'M' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 14.0, fator_alteracao = 7.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Access' AND complexidades.codigo = 'M+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 22.4, fator_alteracao = 11.2
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Access' AND complexidades.codigo = 'A' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 28.0, fator_alteracao = 14.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Access' AND complexidades.codigo = 'A+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 44.8, fator_alteracao = 22.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Access' AND complexidades.codigo = 'MA' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 56.0, fator_alteracao = 28.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Access' AND complexidades.codigo = 'MA+' AND tipos_tarefa.nome = 'NOVO';

-- ========================================
-- STORED PROCEDURES - Fatores corrigidos
-- ========================================
UPDATE fatores_estimativa SET fator_novo = 2.8, fator_alteracao = 1.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Stored Procedures' AND complexidades.codigo = 'MB' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 4.2, fator_alteracao = 2.1
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Stored Procedures' AND complexidades.codigo = 'MB+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 5.6, fator_alteracao = 2.8
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Stored Procedures' AND complexidades.codigo = 'B' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 7.0, fator_alteracao = 3.5
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Stored Procedures' AND complexidades.codigo = 'B+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 11.2, fator_alteracao = 5.6
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Stored Procedures' AND complexidades.codigo = 'M' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 14.0, fator_alteracao = 7.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Stored Procedures' AND complexidades.codigo = 'M+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 22.4, fator_alteracao = 11.2
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Stored Procedures' AND complexidades.codigo = 'A' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 28.0, fator_alteracao = 14.0
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'Stored Procedures' AND complexidades.codigo = 'A+' AND tipos_tarefa.nome = 'NOVO';
