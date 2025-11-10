-- =====================================================
-- Script: 215_add_client_policy_project_documents.sql
-- Descrição: Adicionar política RLS para CLIENTES NORMAIS
-- Data: 2025-11-10
-- Problema: Clientes não conseguem ver documentos dos projetos
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO:
-- =====================================================
-- Políticas existentes cobrem:
-- ✅ admin_master
-- ✅ admin, admin_operacional  
-- ✅ client_admin (is_client_admin=true)
-- ❌ CLIENTES NORMAIS (role='client') NÃO TÊM POLÍTICA!
--
-- Resultado: Usuários Copersucar não veem documentos
-- =====================================================

-- Verificar políticas atuais
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
-- CRIAR POLÍTICA PARA CLIENTES NORMAIS
-- =====================================================

-- Política para Clientes Normais - apenas SELECT (visualização)
CREATE POLICY "project_documents_client_select" ON project_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'client'  -- Cliente normal
  )
  AND EXISTS (
    SELECT 1 FROM projects pr
    INNER JOIN profiles pf ON pf.company_id = pr.company_id
    WHERE pr.id = project_documents.project_id
    AND pf.id = auth.uid()
  )
);

-- Comentário explicativo
COMMENT ON POLICY "project_documents_client_select" ON project_documents IS 
'Permite que clientes normais (role=client) visualizem e baixem documentos dos projetos da sua empresa. Não permite upload/delete.';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Listar TODAS as políticas após criação
SELECT 
  'POLÍTICAS APÓS CRIAÇÃO' as info,
  policyname,
  cmd as operacao,
  roles,
  CASE 
    WHEN policyname LIKE '%admin_master%' THEN '👑 Admin Master'
    WHEN policyname LIKE '%admin_operacional%' THEN '🔧 Admin Operacional'
    WHEN policyname LIKE '%admin%' THEN '⚙️  Admin Normal'
    WHEN policyname LIKE '%client_admin%' THEN '🏢 Client Admin'
    WHEN policyname LIKE '%client_select%' THEN '👤 Cliente Normal'
    ELSE '❓ Outro'
  END as perfil
FROM pg_policies 
WHERE tablename = 'project_documents'
ORDER BY perfil, policyname;

-- Teste de exemplo
SELECT 
  'TESTE DE ACESSO' as info,
  '1. Execute como Admin Master: deve ver TODOS os documentos' as teste_1,
  '2. Execute como Client Admin: deve ver documentos do seu tenant' as teste_2,
  '3. Execute como Cliente Normal: deve ver documentos da sua empresa' as teste_3;

-- =====================================================
-- RESUMO
-- =====================================================
-- ✅ Política criada para clientes normais
-- ✅ Permite SELECT (visualizar e baixar)
-- ❌ Não permite INSERT/DELETE (só visualização)
-- ✅ Filtra por company_id do usuário
-- ✅ Clientes Copersucar agora veem documentos!
-- =====================================================

