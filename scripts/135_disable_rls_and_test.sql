-- Script para desabilitar RLS e testar inserção
-- Execute TODO este script de uma vez

-- 1. Desabilitar RLS na tabela client_admins
ALTER TABLE client_admins DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'client_admins';

-- 3. Buscar os IDs necessários
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

-- 4. Inserir manualmente na tabela client_admins
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

-- 5. Verificar se foi inserido
SELECT * FROM client_admins WHERE email = 'contatoagilepoint@gmail.com';
