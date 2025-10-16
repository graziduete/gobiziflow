-- =====================================================
-- Script: 205_fix_client_admin_tasks_update.sql
-- Descrição: Corrigir permissões de UPDATE para Client Admin em tasks
-- Data: 2025-01-16
-- Objetivo: Permitir que Client Admin salve justificativas de atraso
-- =====================================================

-- =====================================================
-- IMPORTANTE: Este script é SEGURO para produção
-- - Apenas adiciona permissão de UPDATE para Client Admin
-- - Não remove dados existentes
-- - Mantém todas as outras políticas
-- =====================================================

-- 1. Verificar políticas atuais
SELECT 
    'POLÍTICAS ATUAIS' as info,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'tasks'
ORDER BY policyname;

-- 2. Remover política antiga de UPDATE para Client Admin (se existir)
DROP POLICY IF EXISTS "tasks_client_admin_update" ON public.tasks;

-- 3. Criar nova política de UPDATE para Client Admin
CREATE POLICY "tasks_client_admin_update" ON public.tasks
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_client_admin = TRUE
  )
  AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.client_admins ca ON ca.id = auth.uid()
    WHERE p.id = tasks.project_id 
    AND p.tenant_id = ca.company_id
  )
);

-- 4. Verificar se a política foi criada
SELECT 
    'POLÍTICAS APÓS CORREÇÃO' as info,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'tasks'
AND policyname LIKE '%client_admin%'
ORDER BY policyname;

-- 5. Teste de verificação
DO $$
DECLARE
    client_admin_count INTEGER;
    update_policy_count INTEGER;
BEGIN
    -- Verificar se existem client_admins
    SELECT COUNT(*) INTO client_admin_count
    FROM public.client_admins;
    
    -- Verificar se a política de UPDATE foi criada
    SELECT COUNT(*) INTO update_policy_count
    FROM pg_policies 
    WHERE tablename = 'tasks'
    AND policyname = 'tasks_client_admin_update'
    AND cmd = 'UPDATE';
    
    RAISE NOTICE 'Verificação:';
    RAISE NOTICE '- Client Admins cadastrados: %', client_admin_count;
    RAISE NOTICE '- Política de UPDATE criada: %', CASE WHEN update_policy_count > 0 THEN 'SIM' ELSE 'NÃO' END;
    
    IF update_policy_count > 0 THEN
        RAISE NOTICE '✅ CORREÇÃO APLICADA COM SUCESSO!';
    ELSE
        RAISE NOTICE '❌ ERRO: Política de UPDATE não foi criada!';
    END IF;
END $$;
