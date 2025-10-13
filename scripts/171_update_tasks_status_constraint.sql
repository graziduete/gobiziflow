-- Script para adicionar o novo status "completed_delayed" na tabela tasks
-- Baseado na análise: a tabela usa CONSTRAINT CHECK, não ENUM

-- 1. Remover o constraint atual
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- 2. Adicionar o novo constraint com o status "completed_delayed"
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
CHECK (status = ANY (ARRAY[
    'not_started'::text, 
    'in_progress'::text, 
    'completed'::text, 
    'completed_delayed'::text,  -- NOVO STATUS
    'on_hold'::text
]));

-- 3. Verificar se o constraint foi aplicado corretamente
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tasks'::regclass 
AND contype = 'c'
AND conname = 'tasks_status_check';

-- 4. Testar inserção com o novo status (opcional - descomente para testar)
-- INSERT INTO tasks (name, project_id, status, created_by) 
-- VALUES ('Teste Completed Delayed', 'test-project-id', 'completed_delayed', 'test-user-id');

-- 5. Verificar se a inserção funcionou (opcional)
-- SELECT status, COUNT(*) as count FROM tasks GROUP BY status ORDER BY status;
