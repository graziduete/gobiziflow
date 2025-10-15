-- =====================================================
-- Script: 197_fix_project_documents_policies.sql
-- Descrição: Corrigir políticas RLS da tabela project_documents
-- Data: 2025-01-15
-- Problema: Admin Operacional não consegue anexar documentos
-- Causa: Políticas verificam projects.tenant_id mas project_documents não tem tenant_id
-- =====================================================

-- =====================================================
-- 1. REMOVER POLÍTICAS PROBLEMÁTICAS
-- =====================================================

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "project_documents_admin_all" ON project_documents;
DROP POLICY IF EXISTS "project_documents_admin_operacional_all" ON project_documents;
DROP POLICY IF EXISTS "project_documents_admin_operacional_select" ON project_documents;
DROP POLICY IF EXISTS "project_documents_admin_operacional_insert" ON project_documents;
DROP POLICY IF EXISTS "project_documents_admin_operacional_delete" ON project_documents;
DROP POLICY IF EXISTS "project_documents_client_read" ON project_documents;
DROP POLICY IF EXISTS "project_documents_client_admin_all" ON project_documents;

-- =====================================================
-- 2. CRIAR POLÍTICAS SIMPLIFICADAS E FUNCIONAIS
-- =====================================================

-- Política para Admin Master - acesso total
CREATE POLICY "project_documents_admin_master_all" ON project_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para Admin Normal - acesso total
CREATE POLICY "project_documents_admin_normal_all" ON project_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_normal'
  )
);

-- Política para Admin Operacional - acesso total
CREATE POLICY "project_documents_admin_operacional_all" ON project_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_operacional'
  )
);

-- Política para Client Admin - acesso aos documentos dos projetos que podem ver
CREATE POLICY "project_documents_client_admin_access" ON project_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_client_admin = true
  )
  AND EXISTS (
    SELECT 1 FROM client_admins ca
    WHERE ca.id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_documents.project_id
      AND p.tenant_id = ca.company_id
    )
  )
);

-- =====================================================
-- 3. VERIFICAÇÃO DAS POLÍTICAS CRIADAS
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

-- =====================================================
-- FIM DO SCRIPT 197
-- =====================================================
-- ✅ Políticas simplificadas criadas
-- ✅ Admin Operacional agora deve conseguir anexar documentos
-- ✅ Verificação automática das políticas
-- =====================================================
