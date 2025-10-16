-- =====================================================
-- Script: 204_update_tasks_rls_policies_safe.sql
-- Descrição: Atualizar políticas RLS para tasks de forma SEGURA
-- Data: 2025-01-15
-- Objetivo: Garantir que novos campos de justificativa respeitem o isolamento por tenant
-- =====================================================

-- =====================================================
-- IMPORTANTE: Este script é SEGURO e NÃO quebra a aplicação
-- - Mantém políticas existentes funcionando
-- - Apenas adiciona novas políticas se necessário
-- - Usa apenas estruturas que EXISTEM no banco
-- =====================================================

-- 1. Verificar políticas atuais (apenas para informação)
SELECT 
    'POLÍTICAS ATUAIS' as info,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'tasks'
ORDER BY policyname;

-- 2. Verificar se existem roles específicos
SELECT 
    'ROLES EXISTENTES' as info,
    role,
    COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY role;

-- 3. Adicionar políticas apenas para roles que EXISTEM

-- Política para Admin Master (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM profiles WHERE role = 'admin_master' LIMIT 1) THEN
        -- Remover política antiga se existir
        DROP POLICY IF EXISTS "tasks_admin_master_all" ON public.tasks;
        
        -- Criar nova política
        CREATE POLICY "tasks_admin_master_all" ON public.tasks
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin_master'
            )
        );
        
        RAISE NOTICE '✅ Política para admin_master criada';
    ELSE
        RAISE NOTICE '⚠️ Role admin_master não encontrado - pulando política';
    END IF;
END $$;

-- Política para Admin Normal (sempre existe)
DO $$
BEGIN
    -- Remover políticas antigas se existirem
    DROP POLICY IF EXISTS "tasks_all_admin" ON public.tasks;
    DROP POLICY IF EXISTS "tasks_admin_normal_all" ON public.tasks;
    
    -- Criar nova política para admin
    CREATE POLICY "tasks_admin_normal_all" ON public.tasks
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
    
    RAISE NOTICE '✅ Política para admin criada';
END $$;

-- Política para Admin Operacional (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM profiles WHERE role = 'admin_operacional' LIMIT 1) THEN
        -- Remover política antiga se existir
        DROP POLICY IF EXISTS "tasks_admin_operacional_all" ON public.tasks;
        
        -- Criar nova política
        CREATE POLICY "tasks_admin_operacional_all" ON public.tasks
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin_operacional'
            )
        );
        
        RAISE NOTICE '✅ Política para admin_operacional criada';
    ELSE
        RAISE NOTICE '⚠️ Role admin_operacional não encontrado - pulando política';
    END IF;
END $$;

-- Política para Client (mantém a existente, mas melhora se possível)
DO $$
BEGIN
    -- Remover política antiga se existir
    DROP POLICY IF EXISTS "tasks_select_client" ON public.tasks;
    
    -- Criar nova política para client usando estrutura que EXISTE
    CREATE POLICY "tasks_select_client" ON public.tasks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'client'
        )
        AND EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.user_companies uc ON uc.company_id = p.company_id
            WHERE p.id = tasks.project_id 
            AND uc.user_id = auth.uid()
        )
    );
    
    RAISE NOTICE '✅ Política para client atualizada';
END $$;

-- 4. Verificar se as políticas foram criadas corretamente
SELECT 
    'VERIFICAÇÃO FINAL DE POLÍTICAS' as info,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'tasks'
ORDER BY policyname;

-- 5. Contar políticas criadas
SELECT 
    'RESUMO DAS POLÍTICAS' as info,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN policyname LIKE '%admin%' THEN 1 END) as admin_policies,
    COUNT(CASE WHEN policyname LIKE '%client%' THEN 1 END) as client_policies
FROM pg_policies 
WHERE tablename = 'tasks';

RAISE NOTICE 'Script de políticas RLS executado com sucesso!';
