-- Script para verificar o relacionamento entre client_companies e client_admins
-- Este script vai mostrar se o company_id está correto

-- 1. Verificar a empresa cliente
SELECT 
    id,
    type,
    corporate_name,
    full_name,
    email,
    status
FROM client_companies 
WHERE email LIKE '%contatoagilepoint%'
ORDER BY created_at DESC;

-- 2. Verificar o client_admin
SELECT 
    id,
    company_id,
    full_name,
    email,
    status,
    created_at
FROM client_admins 
WHERE email LIKE '%contatoagilepoint%'
ORDER BY created_at DESC;

-- 3. Verificar o perfil do usuário
SELECT 
    id,
    role,
    company_id,
    is_client_admin,
    first_login_completed,
    email,
    full_name
FROM profiles 
WHERE email LIKE '%contatoagilepoint%'
ORDER BY created_at DESC;

-- 4. Verificar se os company_ids coincidem
SELECT 
    cc.id as client_company_id,
    cc.corporate_name,
    cc.full_name as company_full_name,
    ca.id as client_admin_id,
    ca.company_id as admin_company_id,
    ca.full_name as admin_full_name,
    p.id as profile_id,
    p.company_id as profile_company_id,
    p.role,
    p.is_client_admin
FROM client_companies cc
LEFT JOIN client_admins ca ON cc.id = ca.company_id
LEFT JOIN profiles p ON ca.id = p.id
WHERE cc.email LIKE '%contatoagilepoint%';
