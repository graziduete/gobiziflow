-- Script para corrigir RLS da tabela responsaveis
-- Executar no Supabase SQL Editor

-- 1. Verificar se a tabela existe e tem dados
SELECT COUNT(*) as total_responsaveis FROM responsaveis;

-- 2. Verificar políticas RLS existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'responsaveis';

-- 3. Desabilitar RLS temporariamente para teste
ALTER TABLE responsaveis DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se agora consegue acessar os dados
SELECT id, nome, email FROM responsaveis LIMIT 5;

-- 5. Reabilitar RLS
ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;

-- 6. Recriar política RLS correta
DROP POLICY IF EXISTS "Responsaveis são visíveis para todos os admins" ON responsaveis;

CREATE POLICY "Responsaveis são visíveis para todos os admins" ON responsaveis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'admin_operacional')
    )
  );

-- 7. Verificar se a política foi criada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'responsaveis';
