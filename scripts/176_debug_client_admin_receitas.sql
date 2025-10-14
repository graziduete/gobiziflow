-- Script: 176_debug_client_admin_receitas.sql
-- Debug do Client Admin para receitas
-- Data: 2025-10-14
-- Descrição: Verifica se o Client Admin existe e tem os dados corretos

-- 1. Verificar se o Client Admin existe na tabela profiles
SELECT 
    'PROFILE CHECK' as check_type,
    id,
    role,
    is_client_admin,
    full_name,
    email
FROM profiles 
WHERE id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';

-- 2. Verificar se o Client Admin existe na tabela client_admins
SELECT 
    'CLIENT_ADMIN CHECK' as check_type,
    id,
    company_id,
    email
FROM client_admins 
WHERE id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';

-- 3. Se existir company_id, verificar se a company existe
SELECT 
    'COMPANY CHECK' as check_type,
    id,
    name,
    tenant_id
FROM companies 
WHERE id = (
    SELECT company_id 
    FROM client_admins 
    WHERE id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84'
);

-- 4. Verificar estrutura da tabela revenue_entries
SELECT 
    'REVENUE_ENTRIES STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'revenue_entries' 
ORDER BY ordinal_position;

-- 5. Verificar se há receitas existentes para este tenant
SELECT 
    'EXISTING REVENUES' as check_type,
    COUNT(*) as total_revenues,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as null_tenant,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as with_tenant
FROM revenue_entries;

-- 6. Verificar receitas específicas do tenant do Client Admin
SELECT 
    'TENANT REVENUES' as check_type,
    id,
    client,
    amount,
    tenant_id,
    created_at
FROM revenue_entries 
WHERE tenant_id = (
    SELECT company_id 
    FROM client_admins 
    WHERE id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84'
)
ORDER BY created_at DESC;
