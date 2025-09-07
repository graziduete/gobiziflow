-- Script para adicionar status "homologation" à tabela projects
-- Executar no Supabase SQL Editor

-- 1. Verificar constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.projects'::regclass 
AND contype = 'c' 
AND conname LIKE '%status%';

-- 2. Dropar a constraint atual
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_status_check;

-- 3. Adicionar nova constraint com status "homologation"
ALTER TABLE projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('planning', 'in_progress', 'homologation', 'on_hold', 'delayed', 'completed', 'cancelled'));

-- 4. Verificar se a nova constraint foi criada
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.projects'::regclass 
AND contype = 'c' 
AND conname LIKE '%status%';