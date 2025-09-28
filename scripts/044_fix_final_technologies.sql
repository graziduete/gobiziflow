-- Continuação final do script para corrigir TODOS os fatores
-- PowerShell, UIPATH, AA, ARP, BP, AutoIt, .NET, SQL

-- ========================================
-- POWERSHELL - Fatores corrigidos
-- ========================================
UPDATE fatores_estimativa SET fator_novo = 2.8, fator_alteracao = 1.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'PowerShell' AND complexidades.codigo = 'MB' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 5.6, fator_alteracao = 2.8
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'PowerShell' AND complexidades.codigo = 'MB+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 8.4, fator_alteracao = 4.2
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'PowerShell' AND complexidades.codigo = 'B' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 11.2, fator_alteracao = 5.6
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'PowerShell' AND complexidades.codigo = 'B+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 16.8, fator_alteracao = 8.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'PowerShell' AND complexidades.codigo = 'M' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 22.4, fator_alteracao = 11.2
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'PowerShell' AND complexidades.codigo = 'M+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 33.6, fator_alteracao = 16.8
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'PowerShell' AND complexidades.codigo = 'A' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 44.8, fator_alteracao = 22.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'PowerShell' AND complexidades.codigo = 'A+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 67.2, fator_alteracao = 33.6
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'PowerShell' AND complexidades.codigo = 'MA' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 89.6, fator_alteracao = 44.8
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'PowerShell' AND complexidades.codigo = 'MA+' AND tipos_tarefa.nome = 'NOVO';

-- ========================================
-- UIPATH - Fatores corrigidos (baseado nos prints)
-- ========================================
UPDATE fatores_estimativa SET fator_novo = 3.64, fator_alteracao = 1.82
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'UIPATH' AND complexidades.codigo = 'MB' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 4.62, fator_alteracao = 3.08
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'UIPATH' AND complexidades.codigo = 'MB+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 7.7, fator_alteracao = 4.62
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'UIPATH' AND complexidades.codigo = 'B' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 9.24, fator_alteracao = 4.62
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'UIPATH' AND complexidades.codigo = 'B+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 15.4, fator_alteracao = 9.24
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'UIPATH' AND complexidades.codigo = 'M' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 18.48, fator_alteracao = 11.08
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'UIPATH' AND complexidades.codigo = 'M+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 30.8, fator_alteracao = 18.48
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'UIPATH' AND complexidades.codigo = 'A' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 36.96, fator_alteracao = 22.18
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'UIPATH' AND complexidades.codigo = 'A+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 61.6, fator_alteracao = 36.96
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'UIPATH' AND complexidades.codigo = 'MA' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 73.92, fator_alteracao = 44.35
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'UIPATH' AND complexidades.codigo = 'MA+' AND tipos_tarefa.nome = 'NOVO';
