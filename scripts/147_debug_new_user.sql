-- Script para debugar o novo usuário criado
-- Execute este script para verificar as flags do usuário

-- 1. Verificar o usuário criado
SELECT 
    id,
    full_name,
    email,
    role,
    is_first_login,
    first_login_completed,
    is_client_admin,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'duetegrazi@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Verificar se existe na tabela user_companies
SELECT 
    uc.user_id,
    uc.company_id,
    c.name as company_name,
    p.full_name,
    p.email
FROM user_companies uc
JOIN companies c ON uc.company_id = c.id
JOIN profiles p ON uc.user_id = p.id
WHERE p.email = 'duetegrazi@gmail.com';

-- 3. Verificar se o usuário existe no Supabase Auth
-- (Vá no Supabase Dashboard > Authentication > Users para verificar)

-- 4. Verificar se há múltiplos registros
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN is_first_login = true THEN 1 END) as first_login_true,
    COUNT(CASE WHEN first_login_completed = false THEN 1 END) as first_login_completed_false,
    COUNT(CASE WHEN is_client_admin = true THEN 1 END) as client_admin
FROM profiles 
WHERE email = 'duetegrazi@gmail.com';
