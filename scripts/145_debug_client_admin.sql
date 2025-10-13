-- Script para debugar o client admin criado
-- Execute este script para verificar o que foi criado

-- 1. Verificar o client admin criado na tabela profiles
SELECT 
    id,
    full_name,
    email,
    role,
    is_client_admin,
    first_login_completed,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'contatoagilepoint@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Verificar se existe na tabela client_admins
SELECT 
    ca.id,
    ca.full_name,
    ca.email,
    ca.company_id,
    ca.status,
    cc.corporate_name,
    cc.email as company_email
FROM client_admins ca
JOIN client_companies cc ON ca.company_id = cc.id
WHERE ca.email = 'contatoagilepoint@gmail.com'
ORDER BY ca.created_at DESC
LIMIT 1;

-- 3. Verificar se o usuário existe no Supabase Auth
-- (Este comando não funciona no SQL Editor, mas você pode verificar no Supabase Dashboard)
-- Vá em Authentication > Users e procure pelo email contatoagilepoint@gmail.com

-- 4. Verificar se há múltiplos registros com o mesmo email
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN is_client_admin = true THEN 1 END) as client_admin_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_profiles
FROM profiles 
WHERE email = 'contatoagilepoint@gmail.com';
