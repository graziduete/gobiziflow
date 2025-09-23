-- Testar se o status 'commercial_proposal' é aceito na tabela projects
-- Primeiro, vamos ver a estrutura da coluna status
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'status';

-- Verificar se há constraints na coluna status
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'projects' 
AND tc.constraint_type = 'CHECK';

-- Tentar atualizar o projeto para commercial_proposal
UPDATE projects 
SET status = 'commercial_proposal' 
WHERE id = 'c51745e3-fbb9-404c-a686-4f784788f6e8';

-- Verificar se a atualização funcionou
SELECT id, name, status, updated_at 
FROM projects 
WHERE id = 'c51745e3-fbb9-404c-a686-4f784788f6e8';