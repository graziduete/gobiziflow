-- Script: 085_add_tax_fields_to_revenues.sql
-- Adicionar campos de imposto à tabela revenue_entries
-- Criado em: 2024-12-19
-- Descrição: Adiciona campos de imposto se a tabela já existir

-- Adicionar colunas de imposto se não existirem
DO $$ 
BEGIN
    -- Adicionar tax_percentage se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'revenue_entries' AND column_name = 'tax_percentage') THEN
        ALTER TABLE revenue_entries ADD COLUMN tax_percentage DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    -- Adicionar tax_amount se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'revenue_entries' AND column_name = 'tax_amount') THEN
        ALTER TABLE revenue_entries ADD COLUMN tax_amount DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Adicionar net_amount se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'revenue_entries' AND column_name = 'net_amount') THEN
        ALTER TABLE revenue_entries ADD COLUMN net_amount DECIMAL(15,2) DEFAULT 0;
    END IF;
END $$;

-- Atualizar registros existentes com valores padrão de imposto
UPDATE revenue_entries 
SET 
    tax_percentage = CASE 
        WHEN type = 'Sustentação' THEN 10.00
        WHEN type = 'Desenvolvimento' THEN 15.00
        WHEN type = 'Treinamento' THEN 8.50
        WHEN type = 'Consultoria' THEN 15.00
        ELSE 10.00
    END
WHERE tax_percentage = 0;

-- Recalcular tax_amount e net_amount para registros existentes
UPDATE revenue_entries 
SET 
    tax_amount = (amount * tax_percentage) / 100,
    net_amount = amount - ((amount * tax_percentage) / 100)
WHERE tax_amount = 0 OR net_amount = 0;

-- Criar função para calcular impostos se não existir
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

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_calculate_revenue_taxes') THEN
        CREATE TRIGGER trigger_calculate_revenue_taxes
          BEFORE INSERT OR UPDATE ON revenue_entries
          FOR EACH ROW
          EXECUTE FUNCTION calculate_revenue_taxes();
    END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN revenue_entries.tax_percentage IS 'Percentual de imposto aplicado (ex: 10.00 para 10%)';
COMMENT ON COLUMN revenue_entries.tax_amount IS 'Valor do imposto calculado automaticamente';
COMMENT ON COLUMN revenue_entries.net_amount IS 'Valor líquido (amount - tax_amount) calculado automaticamente';
