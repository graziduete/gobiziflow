-- Script para definir o relacionamento company_id após adicionar a coluna
-- Este script vai relacionar o client_admin com a empresa cliente

-- 1. Buscar o company_id correto da empresa Agile Point
WITH correct_company AS (
    SELECT id as correct_company_id
    FROM client_companies 
    WHERE corporate_name = 'Agile Point' 
    OR email LIKE '%contatoagilepoint%'
    LIMIT 1
)

-- 2. Atualizar o perfil do usuário com o company_id correto
UPDATE profiles 
SET 
    company_id = (SELECT correct_company_id FROM correct_company),
    updated_at = NOW()
WHERE email = 'contatoagilepoint@gmail.com'
AND is_client_admin = true;

-- 3. Verificar se o relacionamento foi criado
SELECT 
    cc.id as client_company_id,
    cc.corporate_name,
    cc.email as company_email,
    p.id as profile_id,
    p.email as profile_email,
    p.company_id as profile_company_id,
    p.role,
    p.is_client_admin,
    ca.id as client_admin_id,
    ca.company_id as admin_company_id
FROM client_companies cc
LEFT JOIN profiles p ON cc.id = p.company_id
LEFT JOIN client_admins ca ON p.id = ca.id
WHERE cc.email LIKE '%contatoagilepoint%'
OR ca.email LIKE '%contatoagilepoint%';
