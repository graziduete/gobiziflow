-- Script para debugar valores das estimativas
-- Verificar se total_estimado e total_com_impostos estão corretos

-- 1. Verificar estimativas por recurso
SELECT 
    id,
    nome_projeto,
    tipo,
    total_estimado,
    total_com_impostos,
    percentual_imposto,
    created_at
FROM estimativas 
WHERE tipo IS NULL OR tipo != 'tarefa'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar estimativas por tarefa
SELECT 
    id,
    nome_projeto,
    tipo,
    total_estimado,
    total_com_impostos,
    percentual_imposto,
    valor_hora,
    percentual_gordura,
    created_at
FROM estimativas 
WHERE tipo = 'tarefa'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar se os cálculos estão corretos para estimativas por tarefa
-- (total_estimado deveria ser = total_horas * valor_hora)
-- (total_com_impostos deveria ser = total_estimado * (1 + percentual_imposto/100))
SELECT 
    id,
    nome_projeto,
    total_estimado,
    total_com_impostos,
    percentual_imposto,
    valor_hora,
    -- Cálculo esperado do total_com_impostos
    ROUND(total_estimado * (1 + percentual_imposto/100), 2) as total_com_impostos_calculado,
    -- Diferença entre o valor salvo e o calculado
    ROUND(total_com_impostos - (total_estimado * (1 + percentual_imposto/100)), 2) as diferenca
FROM estimativas 
WHERE tipo = 'tarefa'
ORDER BY created_at DESC;
