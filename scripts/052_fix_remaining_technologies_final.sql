-- Script para corrigir as tecnologias restantes
-- AA, ARP, BP, AutoIt, .NET, SQL

-- ========================================
-- AA (Automation Anywhere) - Valores corretos da planilha
-- ========================================
UPDATE fatores_estimativa SET fator_novo = 3.36, fator_alteracao = 1.68
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AA' AND complexidades.codigo = 'MB' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 5.04, fator_alteracao = 3.36
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AA' AND complexidades.codigo = 'MB+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 8.4, fator_alteracao = 5.04
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AA' AND complexidades.codigo = 'B' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 10.08, fator_alteracao = 5.04
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AA' AND complexidades.codigo = 'B+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 16.8, fator_alteracao = 10.08
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AA' AND complexidades.codigo = 'M' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 20.16, fator_alteracao = 12.1
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AA' AND complexidades.codigo = 'M+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 33.6, fator_alteracao = 20.16
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AA' AND complexidades.codigo = 'A' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 40.32, fator_alteracao = 24.19
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AA' AND complexidades.codigo = 'A+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 67.2, fator_alteracao = 40.32
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AA' AND complexidades.codigo = 'MA' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 80.64, fator_alteracao = 48.38
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'AA' AND complexidades.codigo = 'MA+' AND tipos_tarefa.nome = 'NOVO';

-- ========================================
-- ARP - Valores corretos da planilha
-- ========================================
UPDATE fatores_estimativa SET fator_novo = 3.08, fator_alteracao = 1.54
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'ARP' AND complexidades.codigo = 'MB' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 4.62, fator_alteracao = 3.08
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'ARP' AND complexidades.codigo = 'MB+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 7.7, fator_alteracao = 4.62
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'ARP' AND complexidades.codigo = 'B' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 9.24, fator_alteracao = 4.62
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'ARP' AND complexidades.codigo = 'B+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 15.4, fator_alteracao = 9.24
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'ARP' AND complexidades.codigo = 'M' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 18.48, fator_alteracao = 11.08
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'ARP' AND complexidades.codigo = 'M+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 30.8, fator_alteracao = 18.48
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'ARP' AND complexidades.codigo = 'A' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 36.96, fator_alteracao = 22.18
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'ARP' AND complexidades.codigo = 'A+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 61.6, fator_alteracao = 36.96
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'ARP' AND complexidades.codigo = 'MA' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 73.92, fator_alteracao = 44.35
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'ARP' AND complexidades.codigo = 'MA+' AND tipos_tarefa.nome = 'NOVO';

-- ========================================
-- BP - Valores corretos da planilha
-- ========================================
UPDATE fatores_estimativa SET fator_novo = 3.36, fator_alteracao = 1.68
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'BP' AND complexidades.codigo = 'MB' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 5.04, fator_alteracao = 3.36
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'BP' AND complexidades.codigo = 'MB+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 8.4, fator_alteracao = 5.04
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'BP' AND complexidades.codigo = 'B' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 10.08, fator_alteracao = 5.04
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'BP' AND complexidades.codigo = 'B+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 16.8, fator_alteracao = 10.08
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'BP' AND complexidades.codigo = 'M' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 20.16, fator_alteracao = 12.1
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'BP' AND complexidades.codigo = 'M+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 33.6, fator_alteracao = 20.16
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'BP' AND complexidades.codigo = 'A' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 40.32, fator_alteracao = 24.19
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'BP' AND complexidades.codigo = 'A+' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 67.2, fator_alteracao = 40.32
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'BP' AND complexidades.codigo = 'MA' AND tipos_tarefa.nome = 'NOVO';

UPDATE fatores_estimativa SET fator_novo = 80.64, fator_alteracao = 48.38
FROM tecnologias, complexidades, tipos_tarefa
WHERE fatores_estimativa.tecnologia_id = tecnologias.id AND fatores_estimativa.complexidade_id = complexidades.id AND fatores_estimativa.tipo_tarefa_id = tipos_tarefa.id
AND tecnologias.nome = 'BP' AND complexidades.codigo = 'MA+' AND tipos_tarefa.nome = 'NOVO';

-- ========================================
-- AUTOIT - Valores corretos da planilha
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
-- .NET - Valores corretos da planilha
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
-- SQL - Valores corretos da planilha
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
-- VERIFICAÇÃO FINAL - TODAS AS TECNOLOGIAS
-- ========================================
SELECT 
  'TODAS AS TECNOLOGIAS CORRIGIDAS' as status,
  t.nome as tecnologia,
  COUNT(*) as total_fatores,
  MIN(f.fator_novo) as min_novo,
  MAX(f.fator_novo) as max_novo
FROM fatores_estimativa f
JOIN tecnologias t ON f.tecnologia_id = t.id
JOIN tipos_tarefa tt ON f.tipo_tarefa_id = tt.id
WHERE tt.nome = 'NOVO'
GROUP BY t.nome
ORDER BY t.nome;
