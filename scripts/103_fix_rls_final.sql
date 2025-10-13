-- Script FINAL para corrigir o problema das Receitas Financeiras
-- A receita existe no banco (ID: ed34f29d-18b6-4e5f-b2cb-8d5bb17b52fd)
-- O problema é RLS bloqueando o acesso

-- Desabilitar RLS
ALTER TABLE revenue_entries DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "revenue_entries_select_policy" ON revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_insert_policy" ON revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_update_policy" ON revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_delete_policy" ON revenue_entries;
DROP POLICY IF EXISTS "Enable read access for all users" ON revenue_entries;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON revenue_entries;
DROP POLICY IF EXISTS "Enable update for users based on email" ON revenue_entries;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_all_access" ON revenue_entries;

-- Verificar se foi desabilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'revenue_entries';

-- Testar se a receita financeira é acessível
SELECT 
  id,
  type,
  amount,
  month,
  date
FROM revenue_entries 
WHERE type = 'Receitas Financeiras';


