-- =====================================================
-- Script: 216_fix_storage_bucket_policies.sql
-- Descrição: Corrigir políticas do BUCKET project-documents
-- Data: 2025-11-10
-- Problema: Mesmo com RLS correto, bucket pode bloquear acesso
-- =====================================================

-- ⚠️ IMPORTANTE:
-- Este script configura as políticas do STORAGE bucket,
-- não da tabela project_documents

-- =====================================================
-- POLÍTICAS DO BUCKET project-documents
-- =====================================================

-- 1. Permitir UPLOAD apenas para Admins e Client Admins
-- (Clientes normais NÃO podem fazer upload)

-- Remover política existente se houver
DROP POLICY IF EXISTS "project_documents_upload" ON storage.objects;

-- Criar política de upload
CREATE POLICY "project_documents_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
  AND (
    -- Admin Master, Admin, Admin Operacional
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin_master', 'admin', 'admin_operacional')
    )
    OR
    -- Client Admin
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND is_client_admin = true
    )
  )
);

-- 2. Permitir SELECT (visualizar/baixar) para TODOS os usuários autenticados
-- que têm permissão para ver o projeto

-- Remover política existente se houver
DROP POLICY IF EXISTS "project_documents_select" ON storage.objects;

-- Criar política de SELECT/download
CREATE POLICY "project_documents_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    -- Admin Master - vê tudo
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin_master'
    )
    OR
    -- Admin Normal/Operacional - vê tudo
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'admin_operacional')
    )
    OR
    -- Client Admin - vê documentos dos projetos do seu tenant
    EXISTS (
      SELECT 1 FROM public.client_admins ca
      INNER JOIN public.projects p ON p.tenant_id = ca.company_id
      INNER JOIN public.project_documents pd ON pd.project_id = p.id
      WHERE ca.id = auth.uid()
      AND storage.objects.name = pd.storage_path
    )
    OR
    -- Cliente Normal - vê documentos dos projetos da sua empresa
    EXISTS (
      SELECT 1 FROM public.profiles prof
      INNER JOIN public.projects p ON p.company_id = prof.company_id
      INNER JOIN public.project_documents pd ON pd.project_id = p.id
      WHERE prof.id = auth.uid()
      AND prof.role = 'client'
      AND storage.objects.name = pd.storage_path
    )
  )
);

-- 3. Permitir DELETE apenas para Admins e Client Admins

-- Remover política existente se houver
DROP POLICY IF EXISTS "project_documents_delete" ON storage.objects;

-- Criar política de DELETE
CREATE POLICY "project_documents_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    -- Admin Master, Admin, Admin Operacional
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin_master', 'admin', 'admin_operacional')
    )
    OR
    -- Client Admin
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND is_client_admin = true
    )
  )
);

-- =====================================================
-- VERIFICAÇÃO DAS POLÍTICAS DO BUCKET
-- =====================================================

SELECT 
  'POLÍTICAS DO BUCKET' as info,
  policyname,
  action,
  roles
FROM storage.policies 
WHERE bucket_id = 'project-documents'
ORDER BY action, policyname;

-- =====================================================
-- RESUMO
-- =====================================================
-- ✅ Upload: Apenas Admins e Client Admins
-- ✅ Select: Admins, Client Admins E CLIENTES NORMAIS
-- ✅ Delete: Apenas Admins e Client Admins
-- ✅ Clientes normais podem visualizar/baixar
-- ❌ Clientes normais NÃO podem upload/delete
-- =====================================================

-- Teste manual (executar como cliente normal):
/*
SELECT 
  pd.file_name,
  pd.storage_path
FROM project_documents pd
INNER JOIN projects p ON p.id = pd.project_id
INNER JOIN profiles prof ON prof.company_id = p.company_id
WHERE prof.id = auth.uid()
  AND prof.role = 'client';
*/

