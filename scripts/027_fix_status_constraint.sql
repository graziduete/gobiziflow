-- Script para corrigir a constraint de status e adicionar commercial_proposal
-- Primeiro, vamos ver a constraint atual
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'projects' 
AND tc.constraint_type = 'CHECK';

-- Remover a constraint atual
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Criar uma nova constraint que inclui commercial_proposal
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status IN (
    'planning',
    'commercial_proposal', 
    'in_progress',
    'homologation',
    'on_hold',
    'delayed',
    'completed',
    'cancelled'
));

-- Agora tentar atualizar o projeto para commercial_proposal
UPDATE projects 
SET status = 'commercial_proposal' 
WHERE id = 'c51745e3-fbb9-404c-a686-4f784788f6e8';

-- Verificar se funcionou
SELECT id, name, status, updated_at 
FROM projects 
WHERE id = 'c51745e3-fbb9-404c-a686-4f784788f6e8';