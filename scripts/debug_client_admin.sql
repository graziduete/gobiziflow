-- Script para debugar Client Admin
-- Verificar se o Client Admin está configurado corretamente

-- 1. Verificar perfil do Client Admin
SELECT 
    id,
    email,
    full_name,
    role,
    is_client_admin
FROM profiles 
WHERE email = 'contatoagilepoint@gmail.com';

-- 2. Verificar tabela client_admins
SELECT 
    id,
    company_id,
    created_at
FROM client_admins 
WHERE id = (
    SELECT id FROM profiles WHERE email = 'contatoagilepoint@gmail.com'
);

-- 3. Verificar empresa associada
SELECT 
    c.id,
    c.name,
    c.tenant_id
FROM companies c
JOIN client_admins ca ON c.id = ca.company_id
WHERE ca.id = (
    SELECT id FROM profiles WHERE email = 'contatoagilepoint@gmail.com'
);

-- 4. Verificar usuários associados à empresa do Client Admin
SELECT 
    uc.user_id,
    uc.company_id,
    p.email,
    p.full_name,
    p.role
FROM user_companies uc
JOIN profiles p ON uc.user_id = p.id
JOIN client_admins ca ON uc.company_id = ca.company_id
WHERE ca.id = (
    SELECT id FROM profiles WHERE email = 'contatoagilepoint@gmail.com'
);
