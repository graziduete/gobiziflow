-- =====================================================
-- Script: 201_fix_project_docs_complete.sql
-- Descrição: Corrigir COMPLETAMENTE o problema de anexos de documentos
-- Data: 2025-01-15
-- Problema: Admin Operacional não consegue anexar documentos
-- Solução: Corrigir RLS + Storage policies
-- =====================================================

-- =====================================================
-- PARTE 1: CORRIGIR RLS DA TABELA project_documents
-- =====================================================

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "project_documents_admin_master_all" ON project_documents;
DROP POLICY IF EXISTS "project_documents_admin_normal_all" ON project_documents;
DROP POLICY IF EXISTS "project_documents_admin_operacional_all" ON project_documents;
DROP POLICY IF EXISTS "project_documents_client_admin_access" ON project_documents;
DROP POLICY IF EXISTS "project_documents_admin_all" ON project_documents;
DROP POLICY IF EXISTS "project_documents_admin_operacional_select" ON project_documents;
DROP POLICY IF EXISTS "project_documents_admin_operacional_insert" ON project_documents;
DROP POLICY IF EXISTS "project_documents_admin_operacional_delete" ON project_documents;
DROP POLICY IF EXISTS "project_documents_client_read" ON project_documents;
DROP POLICY IF EXISTS "project_documents_client_admin_all" ON project_documents;

-- Criar políticas simplificadas e funcionais
CREATE POLICY "project_documents_admin_master_all" ON project_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_master'
  )
);

CREATE POLICY "project_documents_admin_normal_all" ON project_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "project_documents_admin_operacional_all" ON project_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_operacional'
  )
);

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
-- PARTE 2: VERIFICAR E CRIAR BUCKET DE STORAGE
-- =====================================================

-- Verificar se o bucket existe
SELECT 
    'BUCKETS EXISTENTES' as info,
    name,
    public,
    created_at
FROM storage.buckets 
WHERE name = 'project-documents';

-- =====================================================
-- PARTE 3: POLÍTICAS DE STORAGE (se o bucket existir)
-- =====================================================

-- Remover políticas de storage existentes
DROP POLICY IF EXISTS "project_documents_storage_admin_master_all" ON storage.objects;
DROP POLICY IF EXISTS "project_documents_storage_admin_normal_all" ON storage.objects;
DROP POLICY IF EXISTS "project_documents_storage_admin_operacional_all" ON storage.objects;
DROP POLICY IF EXISTS "project_documents_storage_client_admin_access" ON storage.objects;

-- Criar políticas de storage para o bucket project-documents
CREATE POLICY "project_documents_storage_admin_master_all" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_master'
  )
);

CREATE POLICY "project_documents_storage_admin_normal_all" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "project_documents_storage_admin_operacional_all" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin_operacional'
  )
);

CREATE POLICY "project_documents_storage_client_admin_access" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
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
-- PARTE 4: VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar políticas da tabela
SELECT 
    'POLÍTICAS TABELA' as info,
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
WHERE tablename = 'objects' AND policyname LIKE '%project_documents%'
ORDER BY policyname;

-- Verificar status RLS
SELECT 
    'STATUS RLS' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'project_documents';

-- =====================================================
-- FIM DO SCRIPT 201
-- =====================================================
-- ✅ RLS da tabela project_documents corrigido
-- ✅ Políticas de storage criadas
-- ✅ Admin Operacional agora deve conseguir anexar documentos
-- =====================================================
