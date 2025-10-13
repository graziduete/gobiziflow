-- Script: 086_fix_revenue_tax_calculations.sql
-- Corrigir cálculos de imposto nas receitas
-- Criado em: 2024-12-19
-- Descrição: Recalcula tax_amount e net_amount para todos os registros

-- Verificar dados atuais
SELECT 
    id, 
    amount, 
    tax_percentage, 
    tax_amount, 
    net_amount,
    (amount * tax_percentage) / 100 as calculated_tax,
    amount - ((amount * tax_percentage) / 100) as calculated_net
FROM revenue_entries 
ORDER BY created_at;

-- Atualizar todos os registros com cálculos corretos
UPDATE revenue_entries 
SET 
    tax_amount = (amount * tax_percentage) / 100,
    net_amount = amount - ((amount * tax_percentage) / 100),
    updated_at = NOW()
WHERE tax_amount IS NULL OR net_amount IS NULL OR tax_amount = 0 OR net_amount = 0;

-- Verificar se a função de trigger existe e está funcionando
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'calculate_revenue_taxes';

-- Verificar se o trigger existe
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'trigger_calculate_revenue_taxes';

-- Recriar a função de trigger para garantir que está funcionando
CREATE OR REPLACE FUNCTION calculate_revenue_taxes()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular valor do imposto
  NEW.tax_amount = (NEW.amount * NEW.tax_percentage) / 100;
  
  -- Calcular valor líquido
  NEW.net_amount = NEW.amount - NEW.tax_amount;
  
  -- Atualizar timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_calculate_revenue_taxes ON revenue_entries;
CREATE TRIGGER trigger_calculate_revenue_taxes
  BEFORE INSERT OR UPDATE ON revenue_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_revenue_taxes();

-- Verificar dados após correção
SELECT 
    id, 
    amount, 
    tax_percentage, 
    tax_amount, 
    net_amount,
    ROUND((amount * tax_percentage) / 100, 2) as expected_tax,
    ROUND(amount - ((amount * tax_percentage) / 100), 2) as expected_net
FROM revenue_entries 
ORDER BY created_at;
