-- =====================================================
-- Script: 206_check_client_admin_permissions.sql
-- Descrição: Verificar permissões do Client Admin na tabela tasks
-- Data: 2025-01-16
-- Objetivo: Diagnosticar por que Client Admin não consegue fazer UPDATE
-- =====================================================

-- 1. Verificar se a tabela tasks tem RLS habilitado
SELECT 
    'RLS STATUS' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'tasks';

-- 2. Verificar políticas RLS (se existirem)
SELECT 
    'POLÍTICAS RLS' as info,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tasks'
ORDER BY policyname;

-- 3. Verificar permissões da tabela tasks
SELECT 
    'PERMISSÕES TABELA' as info,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'tasks'
ORDER BY grantee, privilege_type;

-- 4. Verificar se o Client Admin existe
SELECT 
    'CLIENT ADMIN' as info,
    ca.id,
    ca.company_id,
    p.email,
    p.role,
    p.is_client_admin
FROM client_admins ca
JOIN profiles p ON p.id = ca.id
WHERE ca.id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';

-- 5. Verificar se a task existe e pertence ao tenant do Client Admin
SELECT 
    'TASK INFO' as info,
    t.id,
    t.name,
    t.status,
    p.tenant_id,
    ca.company_id,
    CASE 
        WHEN p.tenant_id = ca.company_id THEN 'MATCH - OK'
        ELSE 'NO MATCH - PROBLEMA'
    END as tenant_match
FROM tasks t
JOIN projects p ON p.id = t.project_id
JOIN client_admins ca ON ca.company_id = p.tenant_id
WHERE t.id = 'dbc888b2-1a40-47bf-9ef9-b502dccc938f'
AND ca.id = 'a184600e-b2f0-4905-9af1-7a6ff4698d84';

-- 6. Teste de UPDATE manual (simulação)
DO $$
DECLARE
    update_result INTEGER;
BEGIN
    -- Tentar fazer um UPDATE de teste
    UPDATE tasks 
    SET updated_at = NOW()
    WHERE id = 'dbc888b2-1a40-47bf-9ef9-b502dccc938f';
    
    GET DIAGNOSTICS update_result = ROW_COUNT;
    
    IF update_result > 0 THEN
        RAISE NOTICE '✅ UPDATE FUNCIONOU: % linhas atualizadas', update_result;
    ELSE
        RAISE NOTICE '❌ UPDATE FALHOU: nenhuma linha atualizada';
    END IF;
    
    -- Reverter o teste
    UPDATE tasks 
    SET updated_at = updated_at
    WHERE id = 'dbc888b2-1a40-47bf-9ef9-b502dccc938f';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO NO UPDATE: %', SQLERRM;
END $$;
