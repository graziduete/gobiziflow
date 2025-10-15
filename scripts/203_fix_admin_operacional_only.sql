-- =====================================================
-- Script: 203_fix_admin_operacional_only.sql
-- Descrição: Corrigir APENAS o problema do Admin Operacional
-- Data: 2025-01-15
-- Problema: Admin Operacional não consegue anexar documentos
-- Causa: Função is_admin() só verifica role = 'admin', não 'admin_operacional'
-- =====================================================

-- =====================================================
-- 1. ATUALIZAR FUNÇÃO is_admin() PARA INCLUIR admin_operacional
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional', 'admin_master')
  );
$$;

-- =====================================================
-- 2. VERIFICAR SE EXISTEM POLÍTICAS ESPECÍFICAS PARA project_documents
-- =====================================================

-- Listar políticas atuais
SELECT 
    'POLÍTICAS ANTES' as info,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'project_documents'
ORDER BY policyname;

-- =====================================================
-- 3. CRIAR POLÍTICAS ESPECÍFICAS PARA project_documents (se não existirem)
-- =====================================================

-- Verificar se a tabela project_documents existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_documents') THEN
        -- Remover políticas existentes
        DROP POLICY IF EXISTS "project_documents_admin_all" ON project_documents;
        DROP POLICY IF EXISTS "project_documents_admin_operacional_all" ON project_documents;
        
        -- Criar política que usa a função is_admin() atualizada
        CREATE POLICY "project_documents_admin_all" ON project_documents
        FOR ALL TO authenticated
        USING (public.is_admin());
        
        RAISE NOTICE 'Políticas da tabela project_documents criadas/atualizadas';
    ELSE
        RAISE NOTICE 'Tabela project_documents não existe';
    END IF;
END $$;

-- =====================================================
-- 4. CRIAR POLÍTICAS DE STORAGE (se necessário)
-- =====================================================

-- Verificar se o bucket project-documents existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'project-documents') THEN
        -- Remover políticas existentes
        DROP POLICY IF EXISTS "project_documents_storage_admin_all" ON storage.objects;
        
        -- Criar política de storage que usa a função is_admin() atualizada
        CREATE POLICY "project_documents_storage_admin_all" ON storage.objects
        FOR ALL TO authenticated
        USING (
          bucket_id = 'project-documents'
          AND public.is_admin()
        );
        
        RAISE NOTICE 'Políticas de storage project-documents criadas/atualizadas';
    ELSE
        RAISE NOTICE 'Bucket project-documents não existe';
    END IF;
END $$;

-- =====================================================
-- 5. VERIFICAÇÃO FINAL
-- =====================================================

-- Testar a função atualizada
SELECT 
    'FUNÇÃO ATUALIZADA' as info,
    public.is_admin() as is_admin_result;

-- Verificar políticas da tabela
SELECT 
    'POLÍTICAS DEPOIS' as info,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'project_documents'
ORDER BY policyname;

-- Verificar políticas de storage
SELECT 
    'POLÍTICAS STORAGE' as info,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%project_documents%'
ORDER BY policyname;

-- =====================================================
-- FIM DO SCRIPT 203
-- =====================================================
-- ✅ Função is_admin() atualizada para incluir admin_operacional
-- ✅ Políticas da tabela project_documents criadas/atualizadas
-- ✅ Políticas de storage criadas/atualizadas
-- ✅ Admin Operacional agora deve conseguir anexar documentos
-- =====================================================
