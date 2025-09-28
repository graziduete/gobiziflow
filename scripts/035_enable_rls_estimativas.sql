-- =============================================================================
-- Script: Habilitar RLS para Estimativas
-- Descrição: Habilitar RLS e criar política permissiva para estimativas
-- Data: $(date)
-- =============================================================================

-- Habilitar RLS na tabela estimativas
ALTER TABLE estimativas ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "estimativas_select_admin" ON estimativas;
DROP POLICY IF EXISTS "estimativas_insert_admin" ON estimativas;
DROP POLICY IF EXISTS "estimativas_update_admin" ON estimativas;
DROP POLICY IF EXISTS "estimativas_delete_admin" ON estimativas;

-- Criar política permissiva para SELECT (temporária para teste)
CREATE POLICY "estimativas_select_all" ON estimativas
  FOR SELECT USING (true);

-- Criar política para INSERT
CREATE POLICY "estimativas_insert_all" ON estimativas
  FOR INSERT WITH CHECK (true);

-- Criar política para UPDATE
CREATE POLICY "estimativas_update_all" ON estimativas
  FOR UPDATE USING (true);

-- Criar política para DELETE
CREATE POLICY "estimativas_delete_all" ON estimativas
  FOR DELETE USING (true);

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'estimativas';

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'estimativas';
