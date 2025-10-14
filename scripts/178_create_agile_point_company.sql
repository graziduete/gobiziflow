-- Script: 178_create_agile_point_company.sql
-- Criar company Agile Point para o Client Admin
-- Data: 2025-10-14
-- Descrição: Cria a company que está faltando para o Client Admin

-- 1. Verificar se a company já existe (mesmo com ID diferente)
SELECT 
    'BUSCA AGILE POINT' as info,
    id,
    name,
    tenant_id,
    created_at
FROM companies
WHERE name ILIKE '%agile%' OR name ILIKE '%point%'
ORDER BY name;

-- 2. Criar a company Agile Point com o ID que o Client Admin está esperando
INSERT INTO companies (
    id,
    name,
    tenant_id,
    created_at,
    updated_at
) VALUES (
    '1aad7589-6ec0-48c1-b192-5cbe1f3193f2',  -- ID que o Client Admin está usando
    'Agile Point',                              -- Nome da empresa
    '1aad7589-6ec0-48c1-b192-5cbe1f3193f2',  -- tenant_id igual ao company_id
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tenant_id = EXCLUDED.tenant_id,
    updated_at = EXCLUDED.updated_at;

-- 3. Verificar se a company foi criada corretamente
SELECT 
    'COMPANY CRIADA' as status,
    id,
    name,
    tenant_id,
    created_at
FROM companies
WHERE id = '1aad7589-6ec0-48c1-b192-5cbe1f3193f2';

-- 4. Verificar se o Client Admin agora tem acesso à company
SELECT 
    'CLIENT ADMIN + COMPANY' as status,
    ca.id as client_admin_id,
    ca.email as client_admin_email,
    ca.company_id,
    c.name as company_name,
    c.tenant_id as company_tenant_id
FROM client_admins ca
LEFT JOIN companies c ON ca.company_id = c.id
WHERE ca.id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';
