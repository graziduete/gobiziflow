-- =====================================================
-- Script: 199_check_current_policies.sql
-- Descrição: Verificar políticas atuais da tabela project_documents
-- Data: 2025-01-15
-- =====================================================

-- Listar todas as políticas ativas na tabela project_documents
SELECT 
    'POLÍTICAS ATIVAS' as info,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'project_documents'
ORDER BY policyname;

-- Verificar se RLS está habilitado
SELECT 
    'STATUS RLS' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'project_documents';

-- Verificar estrutura da tabela
SELECT 
    'ESTRUTURA TABELA' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'project_documents'
ORDER BY ordinal_position;
