-- Script para corrigir definitivamente o RLS da tabela responsaveis
-- Executar no Supabase SQL Editor

-- 1. Verificar dados existentes
SELECT COUNT(*) as total_responsaveis FROM responsaveis;

-- 2. Desabilitar RLS temporariamente
ALTER TABLE responsaveis DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se consegue acessar os dados
SELECT id, nome, email FROM responsaveis LIMIT 5;

-- 4. Reabilitar RLS
ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;

-- 5. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Responsaveis são visíveis para todos os admins" ON responsaveis;

-- 6. Criar nova política RLS mais permissiva para teste
CREATE POLICY "Admins can access responsaveis" ON responsaveis
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

-- 8. Testar acesso com RLS habilitado
SELECT id, nome, email FROM responsaveis LIMIT 5;
