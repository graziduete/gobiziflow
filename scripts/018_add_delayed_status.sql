-- Adicionar status "delayed" na constraint da tabela projects
-- Script: 018_add_delayed_status.sql

-- 1. Verificar a constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND contype = 'c' 
AND conname LIKE '%status%';

-- 2. Dropar a constraint antiga
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_status_check;

-- 3. Adicionar nova constraint com status "delayed"
ALTER TABLE projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('planning', 'in_progress', 'on_hold', 'delayed', 'completed', 'cancelled'));

-- 4. Verificar se a nova constraint foi criada
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
AND contype = 'c' 
AND conname LIKE '%status%';

-- 5. Testar inserção com status "delayed"
-- INSERT INTO projects (name, status, company_id, created_by) 
-- VALUES ('Teste Status Delayed', 'delayed', 'uuid-da-empresa', 'uuid-do-usuario')
-- ON CONFLICT DO NOTHING;

-- 6. Verificar valores únicos de status na tabela
SELECT DISTINCT status, COUNT(*) as total
FROM projects 
GROUP BY status 
ORDER BY status; 