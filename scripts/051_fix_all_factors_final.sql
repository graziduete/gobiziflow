-- Script FINAL para corrigir TODOS os fatores baseado nas planilhas originais
-- Usa valores exatos da coluna "Novo" das planilhas (sem divisão por balizador)

-- ========================================
-- UIPATH - Valores corretos da planilha
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

UPDATE fatores_estimativa SET fator_novo = 16.38, fator_alteracao = 9.1
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'UIPATH' AND complexidades.codigo = 'M' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 21.84, fator_alteracao = 10.92
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

-- ========================================
-- VBA - Valores corretos da planilha
-- ========================================
UPDATE fatores_estimativa SET fator_novo = 1.4, fator_alteracao = 0.7
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'VBA' AND complexidades.codigo = 'MB' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 2.8, fator_alteracao = 1.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'VBA' AND complexidades.codigo = 'MB+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 4.2, fator_alteracao = 2.1
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'VBA' AND complexidades.codigo = 'B' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 5.6, fator_alteracao = 2.8
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'VBA' AND complexidades.codigo = 'B+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 8.4, fator_alteracao = 4.2
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'VBA' AND complexidades.codigo = 'M' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 11.2, fator_alteracao = 5.6
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'VBA' AND complexidades.codigo = 'M+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 16.8, fator_alteracao = 8.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'VBA' AND complexidades.codigo = 'A' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 22.4, fator_alteracao = 11.2
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'VBA' AND complexidades.codigo = 'A+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 33.6, fator_alteracao = 16.8
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'VBA' AND complexidades.codigo = 'MA' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 44.8, fator_alteracao = 22.4
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'VBA' AND complexidades.codigo = 'MA+' AND tipos_tarefa.nome = 'NOVO';

-- ========================================
-- ACCESS - Valores corretos da planilha
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
-- STORED PROCEDURES - Valores corretos da planilha
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

-- ========================================
-- POWERSHELL - Valores corretos da planilha
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
-- VERIFICAÇÃO FINAL - UIPATH
-- ========================================
SELECT 
  'UIPATH CORRIGIDO' as status,
  t.nome as tecnologia,
  c.codigo as complexidade,
  c.nome as descricao_complexidade,
  f.fator_novo,
  f.fator_alteracao
FROM fatores_estimativa f
JOIN tecnologias t ON f.tecnologia_id = t.id
JOIN complexidades c ON f.complexidade_id = c.id
JOIN tipos_tarefa tt ON f.tipo_tarefa_id = tt.id
WHERE t.nome = 'UIPATH' AND tt.nome = 'NOVO'
ORDER BY c.ordem;
