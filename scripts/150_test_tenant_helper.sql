-- Script 150: Testar função get_user_tenant_id()
-- Este script VALIDA se a função está funcionando corretamente
-- NÃO habilita RLS - apenas testa a função

-- ============================================
-- IMPORTANTE: Execute este script APÓS o 149
-- ============================================

-- ============================================
-- 1. TESTAR FUNÇÃO COM DIFERENTES USUÁRIOS
-- ============================================

DO $$
DECLARE
    admin_master_id UUID;
    admin_normal_id UUID;
    client_admin_id UUID;
    client_admin_company UUID;
    test_result UUID;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'INICIANDO TESTES DA FUNÇÃO get_user_tenant_id()';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- ============================================
    -- TESTE 1: Admin Master
    -- ============================================
    RAISE NOTICE '--- TESTE 1: Admin Master ---';
    
    SELECT id INTO admin_master_id 
    FROM profiles 
    WHERE role = 'admin_master' 
    LIMIT 1;
    
    IF admin_master_id IS NOT NULL THEN
        -- Simular contexto do admin_master
        PERFORM set_config('request.jwt.claim.sub', admin_master_id::text, true);
        
        -- Executar função
        SELECT get_user_tenant_id() INTO test_result;
        
        IF test_result IS NULL THEN
            RAISE NOTICE '✅ Admin Master: Retornou NULL (acesso total) - CORRETO';
        ELSE
            RAISE NOTICE '❌ Admin Master: Retornou % (deveria ser NULL) - ERRO', test_result;
        END IF;
    ELSE
        RAISE NOTICE '⚠️  Admin Master: Nenhum usuário encontrado para testar';
    END IF;
    
    RAISE NOTICE '';

    -- ============================================
    -- TESTE 2: Admin Normal (não client_admin)
    -- ============================================
    RAISE NOTICE '--- TESTE 2: Admin Normal ---';
    
    SELECT id INTO admin_normal_id 
    FROM profiles 
    WHERE role = 'admin' 
    AND COALESCE(is_client_admin, FALSE) = FALSE
    LIMIT 1;
    
    IF admin_normal_id IS NOT NULL THEN
        PERFORM set_config('request.jwt.claim.sub', admin_normal_id::text, true);
        SELECT get_user_tenant_id() INTO test_result;
        
        IF test_result IS NULL THEN
            RAISE NOTICE '✅ Admin Normal: Retornou NULL (acesso total) - CORRETO';
        ELSE
            RAISE NOTICE '❌ Admin Normal: Retornou % (deveria ser NULL) - ERRO', test_result;
        END IF;
    ELSE
        RAISE NOTICE '⚠️  Admin Normal: Nenhum usuário encontrado para testar';
    END IF;
    
    RAISE NOTICE '';

    -- ============================================
    -- TESTE 3: Client Admin
    -- ============================================
    RAISE NOTICE '--- TESTE 3: Client Admin ---';
    
    SELECT ca.id, ca.company_id 
    INTO client_admin_id, client_admin_company
    FROM client_admins ca
    LIMIT 1;
    
    IF client_admin_id IS NOT NULL THEN
        PERFORM set_config('request.jwt.claim.sub', client_admin_id::text, true);
        SELECT get_user_tenant_id() INTO test_result;
        
        IF test_result = client_admin_company THEN
            RAISE NOTICE '✅ Client Admin: Retornou % (company_id correto) - CORRETO', test_result;
        ELSIF test_result IS NULL THEN
            RAISE NOTICE '❌ Client Admin: Retornou NULL (deveria retornar company_id) - ERRO';
        ELSE
            RAISE NOTICE '❌ Client Admin: Retornou % (deveria ser %) - ERRO', test_result, client_admin_company;
        END IF;
    ELSE
        RAISE NOTICE '⚠️  Client Admin: Nenhum usuário encontrado para testar';
    END IF;
    
    RAISE NOTICE '';

    -- ============================================
    -- LIMPAR CONFIGURAÇÃO
    -- ============================================
    PERFORM set_config('request.jwt.claim.sub', '', true);
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TESTES CONCLUÍDOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Se todos os testes passaram (✅): pode executar script 151';
    RAISE NOTICE '2. Se algum teste falhou (❌): NÃO execute script 151';
    RAISE NOTICE '   - Revisar a função get_user_tenant_id()';
    RAISE NOTICE '   - Corrigir os erros antes de habilitar RLS';
    RAISE NOTICE '';
END $$;

-- ============================================
-- 2. CONSULTAS ADICIONAIS PARA VALIDAÇÃO
-- ============================================

-- Verificar estrutura da função
SELECT 
    'Função get_user_tenant_id' as info,
    proname as name,
    prosecdef as is_security_definer,
    provolatile as volatility
FROM pg_proc 
WHERE proname = 'get_user_tenant_id';

-- Verificar usuários disponíveis para teste
SELECT 
    'Usuários Disponíveis' as info,
    COUNT(*) FILTER (WHERE role = 'admin_master') as admin_master_count,
    COUNT(*) FILTER (WHERE role = 'admin' AND COALESCE(is_client_admin, FALSE) = FALSE) as admin_normal_count,
    COUNT(*) FILTER (WHERE COALESCE(is_client_admin, FALSE) = TRUE) as client_admin_count
FROM profiles;

-- Verificar client_admins
SELECT 
    'Client Admins' as info,
    COUNT(*) as total,
    COUNT(DISTINCT company_id) as companies
FROM client_admins;

