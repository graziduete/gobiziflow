-- Script para corrigir a criação de client_admin
-- Este script vai corrigir o usuário existente e verificar triggers

-- 1. Corrigir o usuário existente
UPDATE profiles 
SET 
    role = 'admin',
    is_client_admin = true,
    first_login_completed = false,
    updated_at = NOW()
WHERE email = 'contatoagilepoint@gmail.com'
AND role = 'client';

-- 2. Verificar se há triggers na tabela profiles que podem estar alterando o role
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 3. Verificar se há funções que podem estar alterando o role
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%profiles%'
AND routine_definition LIKE '%role%'
ORDER BY routine_name;

-- 4. Verificar o estado atual do usuário
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
WHERE email = 'contatoagilepoint@gmail.com';
