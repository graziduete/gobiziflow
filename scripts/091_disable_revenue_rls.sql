-- Script: 091_disable_revenue_rls.sql
-- Desabilitar RLS para tabela de receitas
-- Criado em: 2024-12-19

-- Desabilitar RLS para revenue_entries
ALTER TABLE revenue_entries DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Apenas admins podem acessar receitas" ON revenue_entries;

-- Comentário
COMMENT ON TABLE revenue_entries IS 'Entradas detalhadas de receitas - RLS desabilitado para desenvolvimento';
