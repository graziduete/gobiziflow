-- Script: 180_fix_agile_point_company_id.sql
-- Corrigir company_id do Client Admin Agile Point
-- Data: 2025-10-14
-- Descrição: Atualiza o company_id para usar o ID correto da empresa Amesp

-- 1. Verificar o problema atual (deve mostrar company_name = NULL)
SELECT 
    'ANTES DA CORREÇÃO' as status,
    ca.id as client_admin_id,
    ca.email as client_admin_email,
    ca.company_id as current_company_id,
    c.name as company_name
FROM client_admins ca
LEFT JOIN companies c ON ca.company_id = c.id
WHERE ca.id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';

-- 2. CORREÇÃO: Atualizar o company_id para usar o ID correto da empresa Amesp
UPDATE client_admins 
SET company_id = '50a3c737-90b3-495b-9174-9f2342338411'  -- ID correto da empresa Amesp
WHERE id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';

-- 3. Verificar se a correção funcionou
SELECT 
    'APÓS A CORREÇÃO' as status,
    ca.id as client_admin_id,
    ca.email as client_admin_email,
    ca.company_id as company_id,
    c.name as company_name,
    c.tenant_id as company_tenant_id,
    CASE 
        WHEN c.id IS NOT NULL THEN '✅ ASSOCIAÇÃO CORRETA'
        ELSE '❌ EMPRESA NÃO ENCONTRADA'
    END as status_associacao
FROM client_admins ca
LEFT JOIN companies c ON ca.company_id = c.id
WHERE ca.id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';

-- 4. Teste: Verificar se agora consegue buscar receitas para este tenant
SELECT 
    'TESTE RECEITAS' as info,
    COUNT(*) as total_receitas_tenant,
    c.name as empresa_nome
FROM revenue_entries re
JOIN companies c ON re.tenant_id = c.tenant_id
WHERE re.tenant_id = (
    SELECT c2.tenant_id 
    FROM client_admins ca2
    JOIN companies c2 ON ca2.company_id = c2.id
    WHERE ca2.id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84'
)
GROUP BY c.name;
