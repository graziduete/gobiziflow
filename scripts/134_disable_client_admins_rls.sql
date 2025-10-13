-- Script para desabilitar RLS temporariamente na tabela client_admins
-- Execute APENAS para teste - depois vamos reativar

-- 1. Desabilitar RLS na tabela client_admins
ALTER TABLE client_admins DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'client_admins';

-- 3. Tentar inserir manualmente para testar
-- Primeiro, busque os IDs:
SELECT 
    p.id as user_id,
    cc.id as company_id
FROM profiles p
CROSS JOIN client_companies cc
WHERE p.email = 'contatoagilepoint@gmail.com'
AND cc.email LIKE '%contatoagilepoint%'
LIMIT 1;

-- Depois, tente inserir:
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
