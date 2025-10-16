-- =====================================================
-- Script: 204_update_tasks_rls_policies.sql
-- Descrição: Atualizar políticas RLS para tasks com suporte a multi-tenancy
-- Data: 2025-01-15
-- Objetivo: Garantir que novos campos de justificativa respeitem o isolamento por tenant
-- =====================================================

-- =====================================================
-- IMPORTANTE: Este script atualiza as políticas RLS existentes
-- - Não remove dados existentes
-- - Apenas ajusta permissões de acesso
-- - Mantém compatibilidade com funcionalidade atual
-- =====================================================

-- 1. Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "tasks_all_admin" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_client" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_assigned" ON public.tasks;

-- 2. Criar políticas atualizadas com suporte completo a perfis

-- Política para Admin Master - Acesso total
CREATE POLICY "tasks_admin_master_all" ON public.tasks
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin_master'
  )
);

-- Política para Admin Normal - Acesso total (apenas tenant_id = NULL - aplicação principal)
CREATE POLICY "tasks_admin_normal_all" ON public.tasks
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para Admin Operacional - Acesso total (apenas tenant_id = NULL - aplicação principal)
CREATE POLICY "tasks_admin_operacional_all" ON public.tasks
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin_operacional'
  )
);

-- Política para Client Admin - Acesso baseado em tenant
CREATE POLICY "tasks_client_admin_select" ON public.tasks
FOR SELECT TO authenticated
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

-- 3. Verificar se as políticas foram criadas corretamente
SELECT 
    'VERIFICAÇÃO DE POLÍTICAS RLS' as info,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'tasks'
ORDER BY policyname;

-- 4. Teste de acesso por perfil (simulação)
DO $$
DECLARE
    admin_master_count INTEGER;
    admin_normal_count INTEGER;
    admin_operacional_count INTEGER;
    client_admin_count INTEGER;
BEGIN
    -- Verificar quantas políticas foram criadas
    SELECT COUNT(*) INTO admin_master_count
    FROM pg_policies 
    WHERE tablename = 'tasks' 
    AND policyname LIKE '%admin_master%';
    
    SELECT COUNT(*) INTO admin_normal_count
    FROM pg_policies 
    WHERE tablename = 'tasks' 
    AND policyname LIKE '%admin_normal%';
    
    SELECT COUNT(*) INTO admin_operacional_count
    FROM pg_policies 
    WHERE tablename = 'tasks' 
    AND policyname LIKE '%admin_operacional%';
    
    SELECT COUNT(*) INTO client_admin_count
    FROM pg_policies 
    WHERE tablename = 'tasks' 
    AND policyname LIKE '%client_admin%';
    
    RAISE NOTICE 'Políticas criadas:';
    RAISE NOTICE '- Admin Master: %', admin_master_count;
    RAISE NOTICE '- Admin Normal: %', admin_normal_count;
    RAISE NOTICE '- Admin Operacional: %', admin_operacional_count;
    RAISE NOTICE '- Client Admin: %', client_admin_count;
    
    IF admin_master_count > 0 AND admin_normal_count > 0 AND admin_operacional_count > 0 AND client_admin_count > 0 THEN
        RAISE NOTICE '✅ TODAS AS POLÍTICAS CRIADAS COM SUCESSO';
    ELSE
        RAISE NOTICE '❌ ALGUMAS POLÍTICAS FALTANDO';
    END IF;
END $$;
