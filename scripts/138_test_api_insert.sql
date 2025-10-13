-- Script para testar inserção na tabela client_admins com dados reais
-- Este script vai simular exatamente o que a API está tentando fazer

-- 1. Buscar um usuário existente em profiles
SELECT 
    id,
    full_name,
    email,
    role,
    is_client_admin,
    company_id
FROM profiles 
WHERE email = 'contatoagilepoint@gmail.com'
LIMIT 1;

-- 2. Buscar uma empresa cliente
SELECT 
    id,
    type,
    corporate_name,
    full_name,
    email
FROM client_companies 
WHERE email LIKE '%contatoagilepoint%'
LIMIT 1;

-- 3. Tentar inserir na client_admins com dados reais
-- Substitua os IDs pelos valores encontrados nas queries acima
INSERT INTO client_admins (
    id,
    company_id,
    full_name,
    email,
    status
) 
SELECT 
    p.id,
    cc.id,
    'Grazi Duete',
    'contatoagilepoint@gmail.com',
    'active'
FROM profiles p
CROSS JOIN client_companies cc
WHERE p.email = 'contatoagilepoint@gmail.com'
AND cc.email LIKE '%contatoagilepoint%'
LIMIT 1;

-- 4. Verificar se foi inserido
SELECT * FROM client_admins WHERE email = 'contatoagilepoint@gmail.com';

-- 5. Se der erro, vamos tentar com dados fixos (substitua pelos IDs reais)
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
