-- Adicionar o status 'commercial_proposal' na tabela projects
-- Primeiro, vamos verificar se há alguma constraint que limita os valores de status
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'projects' 
AND tc.constraint_type = 'CHECK';

-- Se houver uma constraint, vamos removê-la primeiro
-- (Isso pode variar dependendo de como foi criada a constraint)
-- ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Agora vamos testar se conseguimos inserir o novo status
-- Primeiro, vamos ver os valores atuais de status
SELECT DISTINCT status FROM projects;

-- Testar se conseguimos atualizar um projeto para commercial_proposal
UPDATE projects 
SET status = 'commercial_proposal' 
WHERE id = 'c51745e3-fbb9-404c-a686-4f784788f6e8';

-- Verificar se a atualização funcionou
SELECT id, name, status, updated_at 
FROM projects 
WHERE id = 'c51745e3-fbb9-404c-a686-4f784788f6e8';