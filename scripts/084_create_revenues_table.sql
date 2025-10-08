-- Script: 084_create_revenues_table.sql
-- Módulo de Receitas - Tabela Detalhada
-- Criado em: 2024-12-19
-- Descrição: Tabela para receitas detalhadas baseada na planilha de faturamento

-- Tabela de receitas detalhadas
CREATE TABLE IF NOT EXISTS revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  date DATE NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  client VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 0, -- Percentual de imposto (ex: 10.00 para 10%)
  tax_amount DECIMAL(15,2) DEFAULT 0, -- Valor do imposto calculado
  net_amount DECIMAL(15,2) DEFAULT 0, -- Valor líquido (amount - tax_amount)
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_revenue_entries_month ON revenue_entries(month);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_date ON revenue_entries(date);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_client ON revenue_entries(client);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_type ON revenue_entries(type);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_invoice ON revenue_entries(invoice_number);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_due_date ON revenue_entries(due_date);

-- Inserir dados de exemplo baseados na planilha (com impostos)
INSERT INTO revenue_entries (month, date, invoice_number, client, type, due_date, amount, tax_percentage, notes) VALUES
(4, '2024-04-01', '489', 'Alvean', 'Sustentação', '2024-04-16', 1755.00, 10.00, 'Ref Fevereiro'),
(5, '2024-05-02', '490', 'Ambipar', 'Desenvolvimento', '2024-05-07', 21900.00, 15.00, 'Parcela 2 e 3 - R4'),
(6, '2024-06-04', '491', 'Instituto Votorar', 'Treinamento Sistema Gestão', '2024-06-14', 14737.48, 8.50, 'Melhorias Check-list e App iOS'),
(7, '2024-07-03', '492', 'Copersucar', 'Melhorias Siga Unidades', '2024-07-13', 284124.54, 12.00, 'Parcela 5 de 5'),
(4, '2024-04-15', '493', 'Alvean', 'Sustentação', '2024-04-30', 2500.00, 10.00, 'Ref Março'),
(5, '2024-05-20', '494', 'Ambipar', 'Consultoria', '2024-06-05', 8500.00, 15.00, 'Análise de Processos'),
(6, '2024-06-10', '495', 'Instituto Votorar', 'Desenvolvimento', '2024-06-25', 12000.00, 8.50, 'Ref Abril'),
(7, '2024-07-15', '496', 'Copersucar', 'Ajustes Siga Unidades', '2024-07-30', 45000.00, 12.00, 'Ref Maio'),
(8, '2024-08-01', '497', 'Alvean', 'Sustentação', '2024-08-15', 1800.00, 10.00, 'Ref Junho'),
(8, '2024-08-10', '498', 'Ambipar', 'Treinamento', '2024-08-25', 5500.00, 15.00, 'Capacitação Equipe');

-- Comentários para documentação
COMMENT ON TABLE revenue_entries IS 'Entradas detalhadas de receitas baseadas na planilha de faturamento';
COMMENT ON COLUMN revenue_entries.month IS 'Mês de 1 a 12';
COMMENT ON COLUMN revenue_entries.date IS 'Data da emissão da nota fiscal';
COMMENT ON COLUMN revenue_entries.invoice_number IS 'Número da nota fiscal';
COMMENT ON COLUMN revenue_entries.client IS 'Nome do cliente';
COMMENT ON COLUMN revenue_entries.type IS 'Tipo de serviço prestado';
COMMENT ON COLUMN revenue_entries.due_date IS 'Data de vencimento';
COMMENT ON COLUMN revenue_entries.amount IS 'Valor bruto da receita em reais';
COMMENT ON COLUMN revenue_entries.tax_percentage IS 'Percentual de imposto aplicado (ex: 10.00 para 10%)';
COMMENT ON COLUMN revenue_entries.tax_amount IS 'Valor do imposto calculado automaticamente';
COMMENT ON COLUMN revenue_entries.net_amount IS 'Valor líquido (amount - tax_amount) calculado automaticamente';
COMMENT ON COLUMN revenue_entries.notes IS 'Observações adicionais';

-- RLS (Row Level Security) - Apenas admins podem acessar
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;

-- Política: Apenas usuários com perfil admin podem acessar
CREATE POLICY "Apenas admins podem acessar receitas" ON revenue_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Função para calcular impostos e valor líquido
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

-- Trigger para calcular impostos automaticamente
CREATE TRIGGER trigger_calculate_revenue_taxes
  BEFORE INSERT OR UPDATE ON revenue_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_revenue_taxes();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_revenue_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_revenue_entries_updated_at
  BEFORE UPDATE ON revenue_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_revenue_entries_updated_at();
