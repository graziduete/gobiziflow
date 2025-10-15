-- =====================================================
-- Script: 195_add_tenant_estimativas.sql
-- Descrição: Adicionar tenant_id nas tabelas do módulo de Estimativas
-- Data: 2025-01-15
-- Objetivo: Preparar estrutura para multi-tenancy no módulo de estimativas
-- =====================================================

-- =====================================================
-- IMPORTANTE: Este script APENAS ADICIONA colunas
-- NÃO altera dados existentes
-- NÃO quebra a aplicação atual
-- Todos os registros existentes ficarão com tenant_id = NULL
-- =====================================================

-- 1. Adicionar tenant_id em ESTIMATIVAS (Tabela Principal)
ALTER TABLE estimativas ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_estimativas_tenant_id ON estimativas(tenant_id);

COMMENT ON COLUMN estimativas.tenant_id IS 'ID da empresa cliente (tenant) - NULL para admin principal, preenchido para Client Admin';

-- 2. Adicionar tenant_id em RECURSOS_ESTIMATIVA
ALTER TABLE recursos_estimativa ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_recursos_estimativa_tenant_id ON recursos_estimativa(tenant_id);

COMMENT ON COLUMN recursos_estimativa.tenant_id IS 'Herdado de estimativas.tenant_id - NULL para admin principal, preenchido para Client Admin';

-- 3. Adicionar tenant_id em ALOCACAO_SEMANAL
ALTER TABLE alocacao_semanal ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_alocacao_semanal_tenant_id ON alocacao_semanal(tenant_id);

COMMENT ON COLUMN alocacao_semanal.tenant_id IS 'Herdado de recursos_estimativa.tenant_id - NULL para admin principal, preenchido para Client Admin';

-- 4. Adicionar tenant_id em TAREFAS_ESTIMATIVA
ALTER TABLE tarefas_estimativa ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_tarefas_estimativa_tenant_id ON tarefas_estimativa(tenant_id);

COMMENT ON COLUMN tarefas_estimativa.tenant_id IS 'Herdado de estimativas.tenant_id - NULL para admin principal, preenchido para Client Admin';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estrutura de ESTIMATIVAS
SELECT 
    'ESTIMATIVAS' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as tenant_preenchido,
    CASE 
        WHEN COUNT(*) = COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) 
        THEN '✅ TODOS os registros com tenant_id = NULL (CORRETO)'
        ELSE '⚠️ Alguns registros com tenant_id preenchido'
    END as status
FROM estimativas

UNION ALL

-- Verificar estrutura de RECURSOS_ESTIMATIVA
SELECT 
    'RECURSOS_ESTIMATIVA' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as tenant_preenchido,
    CASE 
        WHEN COUNT(*) = COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) 
        THEN '✅ TODOS os registros com tenant_id = NULL (CORRETO)'
        ELSE '⚠️ Alguns registros com tenant_id preenchido'
    END as status
FROM recursos_estimativa

UNION ALL

-- Verificar estrutura de ALOCACAO_SEMANAL
SELECT 
    'ALOCACAO_SEMANAL' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as tenant_preenchido,
    CASE 
        WHEN COUNT(*) = COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) 
        THEN '✅ TODOS os registros com tenant_id = NULL (CORRETO)'
        ELSE '⚠️ Alguns registros com tenant_id preenchido'
    END as status
FROM alocacao_semanal

UNION ALL

-- Verificar estrutura de TAREFAS_ESTIMATIVA
SELECT 
    'TAREFAS_ESTIMATIVA' as tabela,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as tenant_preenchido,
    CASE 
        WHEN COUNT(*) = COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) 
        THEN '✅ TODOS os registros com tenant_id = NULL (CORRETO)'
        ELSE '⚠️ Alguns registros com tenant_id preenchido'
    END as status
FROM tarefas_estimativa;

-- =====================================================
-- FIM DO SCRIPT 195
-- Script executado com sucesso! ✅
-- Próximos passos:
-- 1. Testar a aplicação em /admin/estimativas
-- 2. Verificar se tudo funciona normalmente
-- 3. Modificar frontend para aplicar filtros de tenant
-- =====================================================

