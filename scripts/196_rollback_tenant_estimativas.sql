-- =====================================================
-- Script: 196_rollback_tenant_estimativas.sql
-- Descrição: ROLLBACK - Remover tenant_id das tabelas de Estimativas
-- Data: 2025-01-15
-- Objetivo: Reverter mudanças do script 195 em caso de erro
-- =====================================================

-- ⚠️ ATENÇÃO: Este script REMOVE todas as alterações do script 195
-- Execute APENAS se houver problemas após executar o script 195
-- =====================================================

-- =====================================================
-- BACKUP: Verificar estado ANTES do rollback
-- =====================================================

SELECT 
    'ANTES DO ROLLBACK - ESTIMATIVAS' as info,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as tenant_preenchido
FROM estimativas

UNION ALL

SELECT 
    'ANTES DO ROLLBACK - RECURSOS_ESTIMATIVA' as info,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as tenant_preenchido
FROM recursos_estimativa

UNION ALL

SELECT 
    'ANTES DO ROLLBACK - ALOCACAO_SEMANAL' as info,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as tenant_preenchido
FROM alocacao_semanal

UNION ALL

SELECT 
    'ANTES DO ROLLBACK - TAREFAS_ESTIMATIVA' as info,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as tenant_null,
    COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as tenant_preenchido
FROM tarefas_estimativa;

-- =====================================================
-- 1. REMOVER ÍNDICES
-- =====================================================

DROP INDEX IF EXISTS idx_estimativas_tenant_id;
DROP INDEX IF EXISTS idx_recursos_estimativa_tenant_id;
DROP INDEX IF EXISTS idx_alocacao_semanal_tenant_id;
DROP INDEX IF EXISTS idx_tarefas_estimativa_tenant_id;

-- =====================================================
-- 2. REMOVER COMENTÁRIOS DAS COLUNAS
-- =====================================================

COMMENT ON COLUMN estimativas.tenant_id IS NULL;
COMMENT ON COLUMN recursos_estimativa.tenant_id IS NULL;
COMMENT ON COLUMN alocacao_semanal.tenant_id IS NULL;
COMMENT ON COLUMN tarefas_estimativa.tenant_id IS NULL;

-- =====================================================
-- 3. REMOVER COLUNAS tenant_id
-- =====================================================

ALTER TABLE estimativas DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE recursos_estimativa DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE alocacao_semanal DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE tarefas_estimativa DROP COLUMN IF EXISTS tenant_id;

-- =====================================================
-- VERIFICAÇÃO FINAL DO ROLLBACK
-- =====================================================

-- Verificar se as colunas foram removidas
SELECT 
    'VERIFICAÇÃO ROLLBACK' as info,
    'estimativas' as tabela,
    CASE 
        WHEN COUNT(column_name) = 0 THEN '✅ Coluna tenant_id REMOVIDA com sucesso'
        ELSE '❌ Coluna tenant_id AINDA EXISTE'
    END as status_tenant_id
FROM information_schema.columns
WHERE table_name = 'estimativas' AND column_name = 'tenant_id'

UNION ALL

SELECT 
    'VERIFICAÇÃO ROLLBACK' as info,
    'recursos_estimativa' as tabela,
    CASE 
        WHEN COUNT(column_name) = 0 THEN '✅ Coluna tenant_id REMOVIDA com sucesso'
        ELSE '❌ Coluna tenant_id AINDA EXISTE'
    END as status_tenant_id
FROM information_schema.columns
WHERE table_name = 'recursos_estimativa' AND column_name = 'tenant_id'

UNION ALL

SELECT 
    'VERIFICAÇÃO ROLLBACK' as info,
    'alocacao_semanal' as tabela,
    CASE 
        WHEN COUNT(column_name) = 0 THEN '✅ Coluna tenant_id REMOVIDA com sucesso'
        ELSE '❌ Coluna tenant_id AINDA EXISTE'
    END as status_tenant_id
FROM information_schema.columns
WHERE table_name = 'alocacao_semanal' AND column_name = 'tenant_id'

UNION ALL

SELECT 
    'VERIFICAÇÃO ROLLBACK' as info,
    'tarefas_estimativa' as tabela,
    CASE 
        WHEN COUNT(column_name) = 0 THEN '✅ Coluna tenant_id REMOVIDA com sucesso'
        ELSE '❌ Coluna tenant_id AINDA EXISTE'
    END as status_tenant_id
FROM information_schema.columns
WHERE table_name = 'tarefas_estimativa' AND column_name = 'tenant_id';

-- =====================================================
-- FIM DO SCRIPT 196 - ROLLBACK COMPLETO
-- =====================================================
-- ✅ Todas as alterações do script 195 foram revertidas
-- ✅ Aplicação voltou ao estado anterior
-- =====================================================

