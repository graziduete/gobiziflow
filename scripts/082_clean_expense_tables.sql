-- Script: 082_clean_expense_tables.sql
-- Limpeza das tabelas de despesas para teste limpo
-- Criado em: 2024-12-20
-- Descrição: Remove todos os dados das tabelas de categorias e subcategorias

-- Limpar tabela de entradas de despesas primeiro (devido às foreign keys)
DELETE FROM expense_entries;

-- Limpar tabela de subcategorias
DELETE FROM expense_subcategories;

-- Limpar tabela de categorias
DELETE FROM expense_categories;

-- Verificar se as tabelas estão vazias
SELECT 'expense_categories' as tabela, COUNT(*) as registros FROM expense_categories
UNION ALL
SELECT 'expense_subcategories' as tabela, COUNT(*) as registros FROM expense_subcategories
UNION ALL
SELECT 'expense_entries' as tabela, COUNT(*) as registros FROM expense_entries;

-- Comentário de confirmação
COMMENT ON TABLE expense_categories IS 'Tabela limpa - pronta para teste';
COMMENT ON TABLE expense_subcategories IS 'Tabela limpa - pronta para teste';
COMMENT ON TABLE expense_entries IS 'Tabela limpa - pronta para teste';
