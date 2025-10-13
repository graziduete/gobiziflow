-- Script para corrigir o relacionamento company_id entre client_companies e client_admins
-- Este script vai corrigir se os company_ids não estiverem coincidindo

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

-- 3. Atualizar o client_admins com o company_id correto
UPDATE client_admins 
SET 
    company_id = (SELECT correct_company_id FROM correct_company)
WHERE email = 'contatoagilepoint@gmail.com';

-- 4. Verificar se a correção foi aplicada
SELECT 
    cc.id as client_company_id,
    cc.corporate_name,
    ca.company_id as admin_company_id,
    ca.full_name as admin_name,
    p.company_id as profile_company_id,
    p.role,
    p.is_client_admin
FROM client_companies cc
LEFT JOIN client_admins ca ON cc.id = ca.company_id
LEFT JOIN profiles p ON ca.id = p.id
WHERE cc.email LIKE '%contatoagilepoint%'
OR ca.email LIKE '%contatoagilepoint%';
