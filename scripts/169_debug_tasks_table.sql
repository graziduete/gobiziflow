-- Script para debugar a tabela tasks
-- Verificar estrutura da tabela tasks

-- 1. Verificar se a tabela tasks existe e sua estrutura
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- 2. Verificar se há dados na tabela tasks
SELECT COUNT(*) as total_tasks FROM tasks;

-- 3. Verificar as últimas tarefas criadas
SELECT 
    id, 
    name, 
    project_id, 
    status, 
    responsible,
    start_date,
    end_date,
    created_at
FROM tasks 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Verificar se há tarefas para o projeto específico (substitua pelo ID do projeto)
-- SELECT 
--     id, 
--     name, 
--     project_id, 
--     status, 
--     responsible,
--     start_date,
--     end_date
-- FROM tasks 
-- WHERE project_id = '70bf3c89-c4e1-4d6a-9a71-26c05ab539f4'
-- ORDER BY "order" ASC;

-- 5. Verificar se há problemas de RLS na tabela tasks
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks';
