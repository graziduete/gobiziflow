-- Script para debugar a contagem de tarefas
-- Verificar se há estimativas do tipo 'tarefa' e suas tarefas associadas

-- 1. Verificar estimativas do tipo 'tarefa'
SELECT 
    id,
    nome_projeto,
    tipo,
    created_at
FROM estimativas 
WHERE tipo = 'tarefa'
ORDER BY created_at DESC;

-- 2. Verificar tarefas_estimativa para essas estimativas
SELECT 
    te.estimativa_id,
    e.nome_projeto,
    COUNT(*) as total_tarefas
FROM tarefas_estimativa te
JOIN estimativas e ON e.id = te.estimativa_id
WHERE e.tipo = 'tarefa'
GROUP BY te.estimativa_id, e.nome_projeto
ORDER BY total_tarefas DESC;

-- 3. Verificar se a tabela tarefas_estimativa tem dados
SELECT COUNT(*) as total_tarefas_na_tabela FROM tarefas_estimativa;

-- 4. Verificar estrutura da tabela tarefas_estimativa
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tarefas_estimativa' 
ORDER BY ordinal_position;
