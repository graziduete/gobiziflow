-- Script: 094_insert_test_expenses.sql
-- Inserir despesas de teste para Custos dos Serviços Prestados
-- Criado em: 2024-12-19

-- Primeiro, vamos verificar as subcategorias disponíveis
SELECT 
  ec.name as categoria,
  es.name as subcategoria,
  es.id as subcategoria_id
FROM expense_categories ec
JOIN expense_subcategories es ON ec.id = es.category_id
WHERE ec.name IN ('Despesas com Pessoal', 'RDI')
ORDER BY ec.name, es.name;

-- Inserir despesas de teste para "Despesas com Pessoal"
INSERT INTO expense_entries (subcategory_id, year, month, amount, is_projection)
SELECT 
  es.id,
  2024,
  4,
  15000.00,
  false
FROM expense_categories ec
JOIN expense_subcategories es ON ec.id = es.category_id
WHERE ec.name = 'Despesas com Pessoal'
LIMIT 1;

-- Inserir despesas de teste para "RDI"
INSERT INTO expense_entries (subcategory_id, year, month, amount, is_projection)
SELECT 
  es.id,
  2024,
  4,
  5000.00,
  false
FROM expense_categories ec
JOIN expense_subcategories es ON ec.id = es.category_id
WHERE ec.name = 'RDI'
LIMIT 1;

-- Inserir mais algumas despesas para outros meses
INSERT INTO expense_entries (subcategory_id, year, month, amount, is_projection)
SELECT 
  es.id,
  2024,
  5,
  16000.00,
  false
FROM expense_categories ec
JOIN expense_subcategories es ON ec.id = es.category_id
WHERE ec.name = 'Despesas com Pessoal'
LIMIT 1;

INSERT INTO expense_entries (subcategory_id, year, month, amount, is_projection)
SELECT 
  es.id,
  2024,
  5,
  5500.00,
  false
FROM expense_categories ec
JOIN expense_subcategories es ON ec.id = es.category_id
WHERE ec.name = 'RDI'
LIMIT 1;

-- Verificar as despesas inseridas
SELECT 
  ec.name as categoria,
  es.name as subcategoria,
  ee.month,
  ee.amount,
  ee.year
FROM expense_entries ee
JOIN expense_subcategories es ON ee.subcategory_id = es.id
JOIN expense_categories ec ON es.category_id = ec.id
WHERE ee.year = 2024 
  AND ec.name IN ('Despesas com Pessoal', 'RDI')
ORDER BY ee.month, ec.name;
