-- Script: 089_disable_revenue_rls.sql
-- Desabilitar RLS temporariamente para teste
-- Criado em: 2024-12-19

-- Desabilitar RLS na tabela revenue_entries
ALTER TABLE revenue_entries DISABLE ROW LEVEL SECURITY;

-- Verificar se RLS está desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'revenue_entries';

-- Testar consulta simples
SELECT COUNT(*) as total FROM revenue_entries;
