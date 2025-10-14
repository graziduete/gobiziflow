-- Script: 181_verificar_impacto_correcao.sql
-- Verificar impacto da correção antes de executar
-- Data: 2025-10-14
-- Descrição: Analisa o que será afetado pela correção

-- 1. Verificar quantos client_admins existem
SELECT 
    'TOTAL CLIENT ADMINS' as info,
    COUNT(*) as total
FROM client_admins;

-- 2. Verificar se algum outro client_admin usa o mesmo company_id problemático
SELECT 
    'OUTROS CLIENT ADMINS COM MESMO PROBLEMA' as info,
    id,
    email,
    company_id
FROM client_admins
WHERE company_id = '1aad7589-6ec0-48c1-b192-5cbe1f3193f2';

-- 3. Verificar se existe alguma receita com o tenant_id problemático
SELECT 
    'RECEITAS COM TENANT_ID PROBLEMÁTICO' as info,
    COUNT(*) as total_receitas,
    MIN(created_at) as primeira_receita,
    MAX(created_at) as ultima_receita
FROM revenue_entries
WHERE tenant_id = '1aad7589-6ec0-48c1-b192-5cbe1f3193f2';

-- 4. Verificar se existe alguma empresa com o ID problemático
SELECT 
    'EMPRESA COM ID PROBLEMÁTICO' as info,
    id,
    name,
    tenant_id
FROM companies
WHERE id = '1aad7589-6ec0-48c1-b192-5cbe1f3193f2';

-- 5. Verificar se a empresa Amesp já tem outros client_admins associados
SELECT 
    'CLIENT ADMINS JÁ ASSOCIADOS À AMESP' as info,
    COUNT(*) as total_associados
FROM client_admins
WHERE company_id = '50a3c737-90b3-495b-9174-9f2342338411';

-- 6. Verificar receitas existentes da empresa Amesp
SELECT 
    'RECEITAS EXISTENTES DA AMESP' as info,
    COUNT(*) as total_receitas,
    SUM(amount) as valor_total
FROM revenue_entries
WHERE tenant_id = (
    SELECT tenant_id 
    FROM companies 
    WHERE id = '50a3c737-90b3-495b-9174-9f2342338411'
);
