-- Script para verificar o relacionamento usando user_companies
-- Este script vai mostrar como está o relacionamento atual

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
    is_client_admin,
    first_login_completed,
    email,
    full_name
FROM profiles 
WHERE email LIKE '%contatoagilepoint%'
ORDER BY created_at DESC;

-- 4. Verificar relacionamento em user_companies
SELECT 
    uc.user_id,
    uc.company_id,
    uc.role,
    p.email,
    p.full_name,
    p.is_client_admin
FROM user_companies uc
JOIN profiles p ON uc.user_id = p.id
WHERE p.email LIKE '%contatoagilepoint%';

-- 5. Verificar se existe relacionamento entre client_admins e user_companies
SELECT 
    ca.id as client_admin_id,
    ca.company_id as admin_company_id,
    ca.email as admin_email,
    uc.user_id,
    uc.company_id as user_company_id,
    uc.role as user_role
FROM client_admins ca
LEFT JOIN user_companies uc ON ca.id = uc.user_id
WHERE ca.email LIKE '%contatoagilepoint%';
