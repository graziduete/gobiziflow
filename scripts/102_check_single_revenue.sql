-- Script simples para verificar se a receita financeira existe
-- Execute este script no Supabase

-- Verificar todas as receitas
SELECT 
  id,
  month,
  date,
  invoice_number,
  client,
  type,
  amount,
  created_at
FROM revenue_entries 
ORDER BY created_at DESC
LIMIT 10;

-- Verificar especificamente a receita financeira
SELECT 
  id,
  month,
  date,
  invoice_number,
  client,
  type,
  amount,
  created_at
FROM revenue_entries 
WHERE type = 'Receitas Financeiras';

-- Verificar se há receitas de 2025
SELECT 
  COUNT(*) as total_2025,
  COUNT(CASE WHEN type = 'Receitas Financeiras' THEN 1 END) as financial_revenues
FROM revenue_entries 
WHERE date >= '2025-01-01' AND date <= '2025-12-31';


