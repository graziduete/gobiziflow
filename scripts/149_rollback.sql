-- Script 149 Rollback: Remover função get_user_tenant_id
-- Este script remove a função criada pelo script 149
-- É seguro executar - não afeta o funcionamento do sistema

-- ============================================
-- 1. REMOVER FUNÇÃO
-- ============================================

DROP FUNCTION IF EXISTS get_user_tenant_id();

RAISE NOTICE '✅ Função get_user_tenant_id removida com sucesso';

-- ============================================
-- 2. VERIFICAR REMOÇÃO
-- ============================================

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Função removida com sucesso'
        ELSE '❌ Função ainda existe'
    END as status
FROM pg_proc 
WHERE proname = 'get_user_tenant_id';

