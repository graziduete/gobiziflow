-- Script: 177_fix_client_admin_company.sql
-- Corrigir company_id do Client Admin
-- Data: 2025-10-14
-- Descrição: Corrige o company_id do Client Admin que está apontando para uma company inexistente

-- 1. Verificar o problema atual
SELECT 
    'PROBLEMA ATUAL' as status,
    ca.id as client_admin_id,
    ca.email as client_admin_email,
    ca.company_id as current_company_id,
    CASE 
        WHEN c.id IS NULL THEN 'COMPANY NÃO EXISTE'
        ELSE 'COMPANY EXISTE'
    END as company_status
FROM client_admins ca
LEFT JOIN companies c ON ca.company_id = c.id
WHERE ca.id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';

-- 2. Listar todas as companies disponíveis
SELECT 
    'COMPANIES DISPONÍVEIS' as info,
    id,
    name,
    tenant_id
FROM companies
ORDER BY name;

-- 3. Verificar se existe uma company "Agile Point" ou similar
SELECT 
    'BUSCA AGILE POINT' as info,
    id,
    name,
    tenant_id
FROM companies
WHERE name ILIKE '%agile%' OR name ILIKE '%point%'
ORDER BY name;

-- 4. SOLUÇÃO: Atualizar o company_id do Client Admin
-- OPÇÃO A: Associar a uma company existente (descomente e ajuste o ID)
/*
UPDATE client_admins 
SET company_id = 'ID_DA_COMPANY_CORRETA'  -- <<<<<<< SUBSTITUA PELO ID CORRETO
WHERE id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';
*/

-- OPÇÃO B: Criar uma nova company para o Client Admin (descomente se necessário)
/*
INSERT INTO companies (id, name, tenant_id, created_at, updated_at)
VALUES (
    '1aad7589-6ec0-48c1-b192-5cbe1f3193f2',  -- Usar o mesmo ID que já está no client_admins
    'Agile Point',  -- Nome da empresa
    '1aad7589-6ec0-48c1-b192-5cbe1f3193f2',  -- tenant_id igual ao company_id
    NOW(),
    NOW()
);
*/

-- 5. Verificar se a correção funcionou
SELECT 
    'VERIFICAÇÃO APÓS CORREÇÃO' as status,
    ca.id as client_admin_id,
    ca.email as client_admin_email,
    ca.company_id as company_id,
    c.name as company_name,
    c.tenant_id as company_tenant_id
FROM client_admins ca
LEFT JOIN companies c ON ca.company_id = c.id
WHERE ca.id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';
