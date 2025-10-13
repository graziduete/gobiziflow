-- Script para verificar dados de receitas
-- Criado para debug do problema de Receitas Financeiras no DRE

-- Verificar todas as receitas
SELECT 
  id,
  month,
  date,
  invoice_number,
  client,
  type,
  amount,
  tax_amount,
  net_amount,
  created_at
FROM revenue_entries 
ORDER BY created_at DESC;

-- Verificar especificamente receitas financeiras
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
WHERE type = 'Receitas Financeiras'
ORDER BY created_at DESC;

-- Verificar receitas de 2025
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
WHERE date >= '2025-01-01' AND date <= '2025-12-31'
ORDER BY created_at DESC;

-- Contar receitas por tipo
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM revenue_entries 
GROUP BY type
ORDER BY total_amount DESC;


