-- Script: 179_fix_client_admin_amesp.sql
-- Associar Client Admin Agile Point à empresa Amesp
-- Data: 2025-10-14
-- Descrição: Corrige a associação do Client Admin com a empresa Amesp

-- 1. Verificar o problema atual
SELECT 
    'PROBLEMA ATUAL' as status,
    ca.id as client_admin_id,
    ca.email as client_admin_email,
    ca.company_id as current_company_id,
    c.name as company_name
FROM client_admins ca
LEFT JOIN companies c ON ca.company_id = c.id
WHERE ca.id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';

-- 2. Buscar empresas que contenham "amesp" ou "agile"
SELECT 
    'EMPRESAS DISPONÍVEIS' as info,
    id,
    name,
    tenant_id,
    created_at
FROM companies
WHERE name ILIKE '%amesp%' 
   OR name ILIKE '%agile%' 
   OR name ILIKE '%point%'
ORDER BY name;

-- 3. Listar todas as empresas para escolha manual
SELECT 
    'TODAS AS EMPRESAS' as info,
    id,
    name,
    tenant_id,
    CASE 
        WHEN tenant_id IS NULL THEN 'Admin Master/Normal'
        ELSE 'Client Admin'
    END as tipo
FROM companies
ORDER BY name;

-- 4. SOLUÇÃO: Associar Client Admin à empresa Amesp
-- Primeiro, vamos encontrar o ID da empresa Amesp
SELECT 
    'ID DA EMPRESA AMESP' as info,
    id,
    name,
    tenant_id
FROM companies
WHERE name ILIKE '%amesp%'
LIMIT 1;

-- 5. ATUALIZAR o client_admin para usar o ID correto da Amesp
-- IMPORTANTE: Execute apenas APÓS confirmar o ID da empresa Amesp
-- Substitua 'ID_DA_EMPRESA_AMESP' pelo ID real da empresa Amesp
/*
UPDATE client_admins 
SET company_id = 'ID_DA_EMPRESA_AMESP'  -- <<<<<<< SUBSTITUA PELO ID REAL DA AMESP
WHERE id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';
*/

-- 6. Verificação final
SELECT 
    'VERIFICAÇÃO FINAL' as status,
    ca.id as client_admin_id,
    ca.email as client_admin_email,
    ca.company_id,
    c.name as company_name,
    c.tenant_id as company_tenant_id,
    CASE 
        WHEN c.id IS NOT NULL THEN '✅ ASSOCIAÇÃO CORRETA'
        ELSE '❌ EMPRESA NÃO ENCONTRADA'
    END as status_associacao
FROM client_admins ca
LEFT JOIN companies c ON ca.company_id = c.id
WHERE ca.id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';
