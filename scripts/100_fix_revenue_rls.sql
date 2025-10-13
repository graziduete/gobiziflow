-- Script para corrigir RLS da tabela revenue_entries
-- Criado para resolver problema de Receitas Financeiras no DRE

-- Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'revenue_entries';

-- Desabilitar RLS temporariamente (se necessário)
ALTER TABLE revenue_entries DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "revenue_entries_select_policy" ON revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_insert_policy" ON revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_update_policy" ON revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_delete_policy" ON revenue_entries;

-- Verificar se RLS foi desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'revenue_entries';


