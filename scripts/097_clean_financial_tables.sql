-- Script: 097_clean_financial_tables.sql
-- Módulo Financeiro - Limpeza Completa das Tabelas
-- Criado em: 2024-12-19
-- Descrição: Limpa todas as tabelas financeiras para teste limpo

-- ⚠️ ATENÇÃO: Este script remove TODOS os dados das tabelas financeiras!
-- Execute apenas se tiver certeza de que quer limpar tudo.

-- Desabilitar verificação de chaves estrangeiras temporariamente (se necessário)
-- SET session_replication_role = replica;

-- Limpar tabelas na ordem correta (devido às foreign keys)
DELETE FROM expense_entries;
DELETE FROM expense_subcategories;
DELETE FROM expense_categories;

DELETE FROM financial_entries;
DELETE FROM financial_categories;

-- Verificar se as tabelas estão vazias
SELECT 
  'expense_entries' as tabela, 
  COUNT(*) as registros 
FROM expense_entries
UNION ALL
SELECT 
  'expense_subcategories' as tabela, 
  COUNT(*) as registros 
FROM expense_subcategories
UNION ALL
SELECT 
  'expense_categories' as tabela, 
  COUNT(*) as registros 
FROM expense_categories
UNION ALL
SELECT 
  'financial_entries' as tabela, 
  COUNT(*) as registros 
FROM financial_entries
UNION ALL
SELECT 
  'financial_categories' as tabela, 
  COUNT(*) as registros 
FROM financial_categories;

-- Comentário de confirmação
COMMENT ON TABLE expense_categories IS 'Tabela limpa - pronta para teste com categorias pré-definidas';
COMMENT ON TABLE expense_subcategories IS 'Tabela limpa - pronta para teste';
COMMENT ON TABLE expense_entries IS 'Tabela limpa - pronta para teste';
COMMENT ON TABLE financial_categories IS 'Tabela limpa - pronta para teste DRE';
COMMENT ON TABLE financial_entries IS 'Tabela limpa - pronta para teste DRE';

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '✅ TABELAS FINANCEIRAS LIMPAS COM SUCESSO!';
    RAISE NOTICE '📋 Pronto para testar com categorias pré-definidas';
    RAISE NOTICE '🚀 Acesse: http://localhost:3001/admin/financeiro/categorias';
END $$;


