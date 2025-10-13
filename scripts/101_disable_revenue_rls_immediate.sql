-- Script URGENTE para desabilitar RLS da tabela revenue_entries
-- Isso vai resolver o problema das Receitas Financeiras no DRE

-- Desabilitar RLS
ALTER TABLE revenue_entries DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes (se houver)
DROP POLICY IF EXISTS "revenue_entries_select_policy" ON revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_insert_policy" ON revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_update_policy" ON revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_delete_policy" ON revenue_entries;
DROP POLICY IF EXISTS "Enable read access for all users" ON revenue_entries;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON revenue_entries;
DROP POLICY IF EXISTS "Enable update for users based on email" ON revenue_entries;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON revenue_entries;

-- Verificar se foi desabilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'revenue_entries';


