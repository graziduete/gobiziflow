-- Script para corrigir TODOS os fatores baseado nas planilhas fornecidas
-- Este script atualiza os fatores para corresponder exatamente aos valores das planilhas

-- VBA - Fatores corrigidos
UPDATE fatores_estimativa 
SET fator_novo = CASE complexidades.codigo
  WHEN 'MB' THEN 1.4
  WHEN 'MB+' THEN 2.8
  WHEN 'B' THEN 4.2
  WHEN 'B+' THEN 5.6
  WHEN 'M' THEN 8.4
  WHEN 'M+' THEN 11.2
  WHEN 'A' THEN 16.8
  WHEN 'A+' THEN 22.4
  WHEN 'MA' THEN 33.6
  WHEN 'MA+' THEN 44.8
  ELSE fator_novo -- Manter valor atual se não encontrar
END,
fator_alteracao = CASE complexidades.codigo
  WHEN 'MB' THEN 0.7
  WHEN 'MB+' THEN 1.4
  WHEN 'B' THEN 2.1
  WHEN 'B+' THEN 2.8
  WHEN 'M' THEN 4.2
  WHEN 'M+' THEN 5.6
  WHEN 'A' THEN 8.4
  WHEN 'A+' THEN 11.2
  WHEN 'MA' THEN 16.8
  WHEN 'MA+' THEN 22.4
  ELSE fator_alteracao -- Manter valor atual se não encontrar
END
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'VBA'
  AND tipos_tarefa.nome = 'NOVO';

-- Access - Fatores corrigidos
UPDATE fatores_estimativa 
SET fator_novo = CASE complexidades.codigo
  WHEN 'MB' THEN 2.8
  WHEN 'MB+' THEN 4.2
  WHEN 'B' THEN 5.6
  WHEN 'B+' THEN 7.0
  WHEN 'M' THEN 11.2
  WHEN 'M+' THEN 14.0
  WHEN 'A' THEN 22.4
  WHEN 'A+' THEN 28.0
  WHEN 'MA' THEN 44.8
  WHEN 'MA+' THEN 56.0
END,
fator_alteracao = CASE complexidades.codigo
  WHEN 'MB' THEN 1.4
  WHEN 'MB+' THEN 2.1
  WHEN 'B' THEN 2.8
  WHEN 'B+' THEN 3.5
  WHEN 'M' THEN 5.6
  WHEN 'M+' THEN 7.0
  WHEN 'A' THEN 11.2
  WHEN 'A+' THEN 14.0
  WHEN 'MA' THEN 22.4
  WHEN 'MA+' THEN 28.0
END
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'Access'
  AND tipos_tarefa.nome = 'NOVO';

-- Stored Procedures - Fatores corrigidos
UPDATE fatores_estimativa 
SET fator_novo = CASE complexidades.codigo
  WHEN 'MB' THEN 2.8
  WHEN 'MB+' THEN 4.2
  WHEN 'B' THEN 5.6
  WHEN 'B+' THEN 7.0
  WHEN 'M' THEN 11.2
  WHEN 'M+' THEN 14.0
  WHEN 'A' THEN 22.4
  WHEN 'A+' THEN 28.0
END,
fator_alteracao = CASE complexidades.codigo
  WHEN 'MB' THEN 1.4
  WHEN 'MB+' THEN 2.1
  WHEN 'B' THEN 2.8
  WHEN 'B+' THEN 3.5
  WHEN 'M' THEN 5.6
  WHEN 'M+' THEN 7.0
  WHEN 'A' THEN 11.2
  WHEN 'A+' THEN 14.0
END
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'Stored Procedures'
  AND tipos_tarefa.nome = 'NOVO';

-- PowerShell - Fatores corrigidos
UPDATE fatores_estimativa 
SET fator_novo = CASE complexidades.codigo
  WHEN 'MB' THEN 2.8
  WHEN 'MB+' THEN 5.6
  WHEN 'B' THEN 8.4
  WHEN 'B+' THEN 11.2
  WHEN 'M' THEN 16.8
  WHEN 'M+' THEN 22.4
  WHEN 'A' THEN 33.6
  WHEN 'A+' THEN 44.8
  WHEN 'MA' THEN 67.2
  WHEN 'MA+' THEN 89.6
END,
fator_alteracao = CASE complexidades.codigo
  WHEN 'MB' THEN 1.4
  WHEN 'MB+' THEN 2.8
  WHEN 'B' THEN 4.2
  WHEN 'B+' THEN 5.6
  WHEN 'M' THEN 8.4
  WHEN 'M+' THEN 11.2
  WHEN 'A' THEN 16.8
  WHEN 'A+' THEN 22.4
  WHEN 'MA' THEN 33.6
  WHEN 'MA+' THEN 44.8
END
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'PowerShell'
  AND tipos_tarefa.nome = 'NOVO';

-- UIPATH - Fatores corrigidos (baseado nos prints fornecidos)
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
END,
fator_alteracao = CASE complexidades.codigo
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

-- AA (Automation Anywhere) - Fatores corrigidos
UPDATE fatores_estimativa 
SET fator_novo = CASE complexidades.codigo
  WHEN 'MB' THEN 3.36
  WHEN 'MB+' THEN 5.04
  WHEN 'B' THEN 8.4
  WHEN 'B+' THEN 10.08
  WHEN 'M' THEN 16.8
  WHEN 'M+' THEN 20.16
  WHEN 'A' THEN 33.6
  WHEN 'A+' THEN 40.32
  WHEN 'MA' THEN 67.2
  WHEN 'MA+' THEN 80.64
END,
fator_alteracao = CASE complexidades.codigo
  WHEN 'MB' THEN 1.68
  WHEN 'MB+' THEN 3.36
  WHEN 'B' THEN 5.04
  WHEN 'B+' THEN 5.04
  WHEN 'M' THEN 10.08
  WHEN 'M+' THEN 12.1
  WHEN 'A' THEN 20.16
  WHEN 'A+' THEN 24.19
  WHEN 'MA' THEN 40.32
  WHEN 'MA+' THEN 48.38
END
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'AA'
  AND tipos_tarefa.nome = 'NOVO';

-- ARP - Fatores corrigidos
UPDATE fatores_estimativa 
SET fator_novo = CASE complexidades.codigo
  WHEN 'MB' THEN 3.08
  WHEN 'MB+' THEN 4.62
  WHEN 'B' THEN 7.7
  WHEN 'B+' THEN 9.24
  WHEN 'M' THEN 15.4
  WHEN 'M+' THEN 18.48
  WHEN 'A' THEN 30.8
  WHEN 'A+' THEN 36.96
  WHEN 'MA' THEN 61.6
  WHEN 'MA+' THEN 73.92
END,
fator_alteracao = CASE complexidades.codigo
  WHEN 'MB' THEN 1.54
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
  AND tecnologias.nome = 'ARP'
  AND tipos_tarefa.nome = 'NOVO';

-- AutoIt - Fatores corrigidos
UPDATE fatores_estimativa 
SET fator_novo = CASE complexidades.codigo
  WHEN 'MB' THEN 2.8
  WHEN 'MB+' THEN 4.2
  WHEN 'B' THEN 5.6
  WHEN 'B+' THEN 7.0
  WHEN 'M' THEN 11.2
  WHEN 'M+' THEN 14.0
  WHEN 'A' THEN 22.4
  WHEN 'A+' THEN 28.0
  WHEN 'MA' THEN 44.8
  WHEN 'MA+' THEN 56.0
END,
fator_alteracao = CASE complexidades.codigo
  WHEN 'MB' THEN 1.4
  WHEN 'MB+' THEN 2.1
  WHEN 'B' THEN 2.8
  WHEN 'B+' THEN 3.5
  WHEN 'M' THEN 5.6
  WHEN 'M+' THEN 7.0
  WHEN 'A' THEN 11.2
  WHEN 'A+' THEN 14.0
  WHEN 'MA' THEN 22.4
  WHEN 'MA+' THEN 28.0
END
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'AutoIt'
  AND tipos_tarefa.nome = 'NOVO';

-- Windows - Fatores corrigidos
UPDATE fatores_estimativa 
SET fator_novo = CASE complexidades.codigo
  WHEN 'MB' THEN 0.7
  WHEN 'MB+' THEN 1.4
  WHEN 'B' THEN 2.1
  WHEN 'B+' THEN 2.8
  WHEN 'M' THEN 4.2
  WHEN 'M+' THEN 5.6
  WHEN 'A' THEN 8.4
  WHEN 'A+' THEN 11.2
  WHEN 'MA' THEN 16.8
  WHEN 'MA+' THEN 22.4
END,
fator_alteracao = CASE complexidades.codigo
  WHEN 'MB' THEN 0.35
  WHEN 'MB+' THEN 0.7
  WHEN 'B' THEN 1.05
  WHEN 'B+' THEN 1.4
  WHEN 'M' THEN 2.1
  WHEN 'M+' THEN 2.8
  WHEN 'A' THEN 4.2
  WHEN 'A+' THEN 5.6
  WHEN 'MA' THEN 8.4
  WHEN 'MA+' THEN 11.2
END
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'Windows'
  AND tipos_tarefa.nome = 'NOVO';

-- .NET - Fatores corrigidos
UPDATE fatores_estimativa 
SET fator_novo = CASE complexidades.codigo
  WHEN 'MB' THEN 2.8
  WHEN 'MB+' THEN 4.2
  WHEN 'B' THEN 5.6
  WHEN 'B+' THEN 7.0
  WHEN 'M' THEN 11.2
  WHEN 'M+' THEN 14.0
  WHEN 'A' THEN 22.4
  WHEN 'A+' THEN 28.0
  WHEN 'MA' THEN 44.8
  WHEN 'MA+' THEN 56.0
END,
fator_alteracao = CASE complexidades.codigo
  WHEN 'MB' THEN 1.4
  WHEN 'MB+' THEN 2.1
  WHEN 'B' THEN 2.8
  WHEN 'B+' THEN 3.5
  WHEN 'M' THEN 5.6
  WHEN 'M+' THEN 7.0
  WHEN 'A' THEN 11.2
  WHEN 'A+' THEN 14.0
  WHEN 'MA' THEN 22.4
  WHEN 'MA+' THEN 28.0
END
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = '.NET'
  AND tipos_tarefa.nome = 'NOVO';

-- SQL - Fatores corrigidos
UPDATE fatores_estimativa 
SET fator_novo = CASE complexidades.codigo
  WHEN 'MB' THEN 2.8
  WHEN 'MB+' THEN 4.2
  WHEN 'B' THEN 5.6
  WHEN 'B+' THEN 7.0
  WHEN 'M' THEN 11.2
  WHEN 'M+' THEN 14.0
  WHEN 'A' THEN 22.4
  WHEN 'A+' THEN 28.0
  WHEN 'MA' THEN 44.8
  WHEN 'MA+' THEN 56.0
END,
fator_alteracao = CASE complexidades.codigo
  WHEN 'MB' THEN 1.4
  WHEN 'MB+' THEN 2.1
  WHEN 'B' THEN 2.8
  WHEN 'B+' THEN 3.5
  WHEN 'M' THEN 5.6
  WHEN 'M+' THEN 7.0
  WHEN 'A' THEN 11.2
  WHEN 'A+' THEN 14.0
  WHEN 'MA' THEN 22.4
  WHEN 'MA+' THEN 28.0
END
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id 
  AND fatores_estimativa.complexidade_id = complexidades.id
  AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
  AND tecnologias.nome = 'SQL'
  AND tipos_tarefa.nome = 'NOVO';

-- Verificar os resultados para UIPATH especificamente
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
