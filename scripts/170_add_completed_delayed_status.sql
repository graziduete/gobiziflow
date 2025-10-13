-- Script para adicionar o novo status "completed_delayed" na tabela tasks
-- Verificar e atualizar a estrutura da tabela tasks

-- 1. Verificar se a tabela tasks tem constraint de status
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tasks'::regclass 
AND contype = 'c';

-- 2. Verificar se há enum para status
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%status%'
ORDER BY t.typname, e.enumsortorder;

-- 3. Se a tabela tasks usa enum para status, adicionar o novo valor
-- (Descomente se necessário)
-- ALTER TYPE task_status_enum ADD VALUE 'completed_delayed';

-- 4. Se a tabela tasks usa constraint CHECK, verificar se precisa atualizar
-- (Descomente se necessário)
-- ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
-- ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
-- CHECK (status IN ('not_started', 'in_progress', 'completed', 'completed_delayed', 'on_hold', 'delayed'));

-- 5. Verificar a estrutura atual da coluna status
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name = 'status';

-- 6. Verificar dados existentes na tabela tasks
SELECT 
    status,
    COUNT(*) as count
FROM tasks 
GROUP BY status
ORDER BY status;
