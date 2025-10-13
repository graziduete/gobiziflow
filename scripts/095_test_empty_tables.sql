-- Script: 095_test_empty_tables.sql
-- Testar o que acontece quando as tabelas estão vazias
-- Criado em: 2024-12-19

-- Verificar estado atual das tabelas
SELECT 'Estado atual das tabelas:' as info;

-- Contar registros nas tabelas
SELECT 
  'expense_categories' as tabela,
  COUNT(*) as total_registros
FROM expense_categories
UNION ALL
SELECT 
  'expense_subcategories' as tabela,
  COUNT(*) as total_registros
FROM expense_subcategories
UNION ALL
SELECT 
  'expense_entries' as tabela,
  COUNT(*) as total_registros
FROM expense_entries;

-- Simular limpeza das tabelas (comentado para não executar)
-- DELETE FROM expense_entries;
-- DELETE FROM expense_subcategories;
-- DELETE FROM expense_categories;

-- Verificar o que a API retornaria com tabelas vazias
SELECT 'Se as tabelas estivessem vazias, a API retornaria:' as info;

-- Simular resposta da API de categorias com tabelas vazias
SELECT 
  'GET /api/financeiro/categories' as endpoint,
  '{"categories": []}' as resposta_esperada;

-- Simular resposta da API de entries com tabelas vazias  
SELECT 
  'GET /api/financeiro/entries?year=2025' as endpoint,
  '{"entries": []}' as resposta_esperada;

-- Verificar comportamento da aplicação
SELECT 'Comportamento esperado da aplicação:' as info;
SELECT '1. Loading state: Mostrará "Carregando dados..."' as comportamento;
SELECT '2. Categories state: Array vazio []' as comportamento;
SELECT '3. ExpenseEntries state: Array vazio []' as comportamento;
SELECT '4. Tabela: Mostrará apenas header sem categorias' as comportamento;
SELECT '5. Total Geral: R$ 0,00' as comportamento;
