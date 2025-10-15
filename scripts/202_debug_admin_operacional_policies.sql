-- =====================================================
-- Script: 202_debug_admin_operacional_policies.sql
-- Descrição: Investigar por que apenas Admin Operacional tem problema
-- Data: 2025-01-15
-- =====================================================

-- =====================================================
-- 1. VERIFICAR POLÍTICAS ATUAIS DA TABELA project_documents
-- =====================================================

SELECT 
    'POLÍTICAS ATUAIS' as info,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'project_documents'
ORDER BY policyname;

-- =====================================================
-- 2. VERIFICAR POLÍTICAS DE STORAGE
-- =====================================================

SELECT 
    'POLÍTICAS STORAGE' as info,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%project_documents%'
ORDER BY policyname;

-- =====================================================
-- 3. TESTAR POLÍTICAS COM DIFERENTES PERFIS
-- =====================================================

-- Simular teste para Admin Master
SELECT 
    'TESTE ADMIN_MASTER' as info,
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = '00000000-0000-0000-0000-000000000000' AND role = 'admin_master'
    ) as admin_master_exists,
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = '00000000-0000-0000-0000-000000000000' AND role = 'admin'
    ) as admin_exists,
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = '00000000-0000-0000-0000-000000000000' AND role = 'admin_operacional'
    ) as admin_operacional_exists;

-- =====================================================
-- 4. VERIFICAR SE EXISTE POLÍTICA ESPECÍFICA PARA admin_operacional
-- =====================================================

SELECT 
    'POLÍTICA ADMIN_OPERACIONAL' as info,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN qual LIKE '%admin_operacional%' THEN 1 END) as admin_operacional_policies,
    COUNT(CASE WHEN qual LIKE '%admin%' THEN 1 END) as admin_policies,
    COUNT(CASE WHEN qual LIKE '%admin_master%' THEN 1 END) as admin_master_policies
FROM pg_policies 
WHERE tablename = 'project_documents';

-- =====================================================
-- 5. VERIFICAR SE EXISTE POLÍTICA DE STORAGE PARA admin_operacional
-- =====================================================

SELECT 
    'STORAGE ADMIN_OPERACIONAL' as info,
    COUNT(*) as total_storage_policies,
    COUNT(CASE WHEN qual LIKE '%admin_operacional%' THEN 1 END) as admin_operacional_storage_policies,
    COUNT(CASE WHEN qual LIKE '%admin%' THEN 1 END) as admin_storage_policies
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%project_documents%';

-- =====================================================
-- 6. VERIFICAR ESTRUTURA DA TABELA project_documents
-- =====================================================

SELECT 
    'ESTRUTURA TABELA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_documents'
ORDER BY ordinal_position;

-- =====================================================
-- 7. VERIFICAR SE RLS ESTÁ HABILITADO
-- =====================================================

SELECT 
    'STATUS RLS' as info,
    tablename,
    rowsecurity as rls_enabled,
    hasrls as has_rls
FROM pg_tables 
WHERE tablename = 'project_documents';

-- =====================================================
-- 8. LISTAR TODOS OS PERFIS EXISTENTES
-- =====================================================

SELECT 
    'PERFIS EXISTENTES' as info,
    role,
    COUNT(*) as total_users
FROM profiles 
GROUP BY role
ORDER BY role;
