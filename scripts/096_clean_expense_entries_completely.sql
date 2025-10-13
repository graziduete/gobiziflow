-- Script: 096_clean_expense_entries_completely.sql
-- Limpar completamente a tabela expense_entries
-- Criado em: 2024-12-19

-- Verificar estado atual
SELECT 'Estado ANTES da limpeza:' as info;
SELECT COUNT(*) as total_entries FROM expense_entries;

-- Mostrar algumas entradas existentes
SELECT 
  subcategory_id,
  year,
  month,
  amount,
  is_projection
FROM expense_entries 
ORDER BY year, month, subcategory_id
LIMIT 10;

-- Limpar completamente a tabela
DELETE FROM expense_entries;

-- Verificar estado APÓS a limpeza
SELECT 'Estado APÓS a limpeza:' as info;
SELECT COUNT(*) as total_entries FROM expense_entries;

-- Verificar se as categorias e subcategorias ainda existem
SELECT 'Categorias e subcategorias ainda existem:' as info;
SELECT 
  (SELECT COUNT(*) FROM expense_categories) as total_categories,
  (SELECT COUNT(*) FROM expense_subcategories) as total_subcategories;
