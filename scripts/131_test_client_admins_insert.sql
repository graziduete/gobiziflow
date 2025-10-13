-- Script para testar inserção manual na tabela client_admins
-- Este script vai tentar inserir um registro para identificar o problema

-- 1. Buscar o company_id da empresa Agile Point
SELECT 
    id,
    corporate_name,
    email
FROM client_companies 
WHERE corporate_name = 'Agile Point'
OR email LIKE '%contatoagilepoint%'
LIMIT 1;

-- 2. Buscar o user_id do usuário
SELECT 
    id,
    email,
    role,
    is_client_admin
FROM profiles 
WHERE email = 'contatoagilepoint@gmail.com'
LIMIT 1;

-- 3. Tentar inserir manualmente (substitua os IDs pelos valores encontrados acima)
-- INSERT INTO client_admins (
--     id,
--     company_id,
--     full_name,
--     email,
--     status
-- ) VALUES (
--     '[USER_ID_AQUI]',
--     '[COMPANY_ID_AQUI]',
--     'Grazi Duete',
--     'contatoagilepoint@gmail.com',
--     'active'
-- );

-- 4. Verificar se foi inserido
-- SELECT * FROM client_admins WHERE email = 'contatoagilepoint@gmail.com';
