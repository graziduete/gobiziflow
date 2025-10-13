-- Script para corrigir o constraint tasks_status_check
-- Adicionando os status que estavam faltando: 'delayed' e 'completed_delayed'

-- 1. Remover o constraint atual (que está incompleto)
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- 2. Adicionar o constraint completo com TODOS os status
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
CHECK (status = ANY (ARRAY[
    'not_started'::text, 
    'in_progress'::text, 
    'completed'::text, 
    'delayed'::text,           -- STATUS QUE ESTAVA FALTANDO!
    'completed_delayed'::text, -- NOVO STATUS
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

-- 4. Testar inserção com status "delayed" (opcional)
-- INSERT INTO tasks (name, project_id, status, created_by) 
-- VALUES ('Teste Delayed', 'test-project-id', 'delayed', 'test-user-id');

-- 5. Testar inserção com status "completed_delayed" (opcional)
-- INSERT INTO tasks (name, project_id, status, created_by) 
-- VALUES ('Teste Completed Delayed', 'test-project-id', 'completed_delayed', 'test-user-id');
