-- Script para testar a tabela expense_entries
-- Verificar se a tabela existe e tem dados

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expense_entries' 
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_entries FROM expense_entries;

-- Verificar algumas entradas de exemplo
SELECT * FROM expense_entries LIMIT 5;

-- Verificar se há subcategorias para testar
SELECT id, name, category_id FROM expense_subcategories LIMIT 5;
