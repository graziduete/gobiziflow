-- Script para criar relacionamento em user_companies para client_admin
-- Este script vai relacionar o client_admin com a empresa através de user_companies

-- 1. Buscar o company_id correto da empresa Agile Point
WITH correct_company AS (
    SELECT id as correct_company_id
    FROM client_companies 
    WHERE corporate_name = 'Agile Point' 
    OR email LIKE '%contatoagilepoint%'
    LIMIT 1
),
client_admin_profile AS (
    SELECT id as user_id
    FROM profiles 
    WHERE email = 'contatoagilepoint@gmail.com'
    AND is_client_admin = true
    LIMIT 1
)

-- 2. Inserir relacionamento em user_companies
INSERT INTO user_companies (user_id, company_id, role)
SELECT 
    cap.user_id,
    cc.correct_company_id,
    'admin'
FROM client_admin_profile cap
CROSS JOIN correct_company cc
WHERE NOT EXISTS (
    SELECT 1 FROM user_companies uc 
    WHERE uc.user_id = cap.user_id 
    AND uc.company_id = cc.correct_company_id
);

-- 3. Verificar se o relacionamento foi criado
SELECT 
    cc.id as client_company_id,
    cc.corporate_name,
    cc.email as company_email,
    p.id as profile_id,
    p.email as profile_email,
    p.role,
    p.is_client_admin,
    uc.user_id,
    uc.company_id as user_company_id,
    uc.role as user_role,
    ca.id as client_admin_id,
    ca.company_id as admin_company_id
FROM client_companies cc
LEFT JOIN profiles p ON p.email LIKE '%contatoagilepoint%'
LEFT JOIN user_companies uc ON p.id = uc.user_id
LEFT JOIN client_admins ca ON p.id = ca.id
WHERE cc.email LIKE '%contatoagilepoint%'
OR p.email LIKE '%contatoagilepoint%';
