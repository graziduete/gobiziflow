-- =====================================================
-- Script: 198_fix_existing_estimativa_tenant.sql
-- Descrição: Corrigir estimativa existente criada sem tenant_id
-- Data: 2025-01-15
-- Problema: Estimativa criada por Client Admin sem tenant_id
-- =====================================================

-- =====================================================
-- 1. VERIFICAR ESTIMATIVA SEM TENANT_ID
-- =====================================================

-- Buscar estimativa criada recentemente sem tenant_id
SELECT 
    'ESTIMATIVA SEM TENANT_ID' as info,
    id,
    nome_projeto,
    created_by,
    tenant_id,
    created_at
FROM estimativas 
WHERE tenant_id IS NULL 
ORDER BY created_at DESC;

-- =====================================================
-- 2. CORRIGIR TENANT_ID DA ESTIMATIVA
-- =====================================================

-- Atualizar estimativa para incluir tenant_id do Client Admin
-- Substitua 'SEU_CLIENT_ADMIN_ID' pelo ID real do Client Admin que criou a estimativa
-- Substitua 'SEU_TENANT_ID' pelo tenant_id correto do Client Admin

UPDATE estimativas 
SET tenant_id = (
    SELECT ca.company_id 
    FROM client_admins ca 
    WHERE ca.id = estimativas.created_by
)
WHERE tenant_id IS NULL 
AND created_by IN (
    SELECT id FROM client_admins
);

-- =====================================================
-- 3. CORRIGIR TENANT_ID DOS RECURSOS
-- =====================================================

-- Atualizar recursos_estimativa para incluir tenant_id
UPDATE recursos_estimativa 
SET tenant_id = (
    SELECT e.tenant_id 
    FROM estimativas e 
    WHERE e.id = recursos_estimativa.estimativa_id
)
WHERE tenant_id IS NULL;

-- =====================================================
-- 4. CORRIGIR TENANT_ID DAS ALOCAÇÕES
-- =====================================================

-- Atualizar alocacao_semanal para incluir tenant_id
UPDATE alocacao_semanal 
SET tenant_id = (
    SELECT re.tenant_id 
    FROM recursos_estimativa re 
    WHERE re.id = alocacao_semanal.recurso_id
)
WHERE tenant_id IS NULL;

-- =====================================================
-- 5. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a correção foi aplicada
SELECT 
    'APÓS CORREÇÃO' as info,
    id,
    nome_projeto,
    created_by,
    tenant_id,
    created_at
FROM estimativas 
WHERE created_by IN (
    SELECT id FROM client_admins
)
ORDER BY created_at DESC;

-- Verificar estrutura geral
SELECT 
    'ESTRUTURA FINAL' as info,
    'estimativas' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as tenant_preenchido
FROM estimativas

UNION ALL

SELECT 
    'ESTRUTURA FINAL' as info,
    'recursos_estimativa' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as tenant_preenchido
FROM recursos_estimativa

UNION ALL

SELECT 
    'ESTRUTURA FINAL' as info,
    'alocacao_semanal' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as tenant_preenchido
FROM alocacao_semanal;

-- =====================================================
-- FIM DO SCRIPT 198
-- =====================================================
-- ✅ Estimativa corrigida com tenant_id
-- ✅ Recursos e alocações também corrigidos
-- ✅ Client Admin agora deve ver sua estimativa no frontend
-- =====================================================
