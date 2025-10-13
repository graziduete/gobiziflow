-- Script para verificar TODOS os status existentes na tabela tasks
-- Incluindo o status "delayed" que pode estar faltando

-- 1. Verificar constraint atual
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tasks'::regclass 
AND contype = 'c'
AND conname = 'tasks_status_check';

-- 2. Verificar TODOS os status únicos na tabela
SELECT DISTINCT status, COUNT(*) as count
FROM tasks 
GROUP BY status
ORDER BY status;

-- 3. Verificar se há constraint para priority também
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tasks'::regclass 
AND contype = 'c';
