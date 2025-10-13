-- Script para testar inserção manual na tabela client_admins
-- Execute este script para identificar exatamente onde está o problema

-- 1. Buscar os IDs necessários
SELECT 
    p.id as user_id,
    p.email as user_email,
    p.role as user_role,
    cc.id as company_id,
    cc.corporate_name
FROM profiles p
CROSS JOIN client_companies cc
WHERE p.email = 'contatoagilepoint@gmail.com'
AND cc.email LIKE '%contatoagilepoint%'
LIMIT 1;

-- 2. Tentar inserir com dados específicos
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

-- 3. Verificar se foi inserido
SELECT * FROM client_admins WHERE email = 'contatoagilepoint@gmail.com';

-- 4. Se der erro, vamos tentar inserir com dados fixos
-- Substitua os IDs pelos valores encontrados na query 1
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
