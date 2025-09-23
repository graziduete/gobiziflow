-- Teste simples para verificar se o status commercial_proposal é aceito
-- Primeiro, vamos ver os status atuais
SELECT DISTINCT status FROM projects;

-- Tentar atualizar um projeto para commercial_proposal
UPDATE projects 
SET status = 'commercial_proposal' 
WHERE id = 'c51745e3-fbb9-404c-a686-4f784788f6e8';

-- Verificar se funcionou
SELECT id, name, status, updated_at 
FROM projects 
WHERE id = 'c51745e3-fbb9-404c-a686-4f784788f6e8';