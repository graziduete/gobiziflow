-- Script para verificar o role de usuários recentes
-- Este script vai mostrar os usuários criados recentemente e seus roles

-- Verificar usuários criados nas últimas 24 horas
SELECT 
    id,
    full_name,
    email,
    role,
    is_client_admin,
    first_login_completed,
    created_at
FROM profiles 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Verificar se há algum usuário com email contatoagilepoint@gmail.com
SELECT 
    id,
    full_name,
    email,
    role,
    is_client_admin,
    first_login_completed,
    created_at
FROM profiles 
WHERE email LIKE '%contatoagilepoint%'
ORDER BY created_at DESC;
