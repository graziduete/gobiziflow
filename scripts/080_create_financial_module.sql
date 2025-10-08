-- Script: 080_create_financial_module.sql
-- Módulo Financeiro - DRE
-- Criado em: 2024-12-19
-- Descrição: Tabelas para módulo financeiro (DRE)

-- Tabela de categorias financeiras
CREATE TABLE IF NOT EXISTS financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('revenue', 'expense', 'cost')),
  parent_id UUID REFERENCES financial_categories(id),
  formula TEXT, -- Para cálculos automáticos
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de entradas financeiras
CREATE TABLE IF NOT EXISTS financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES financial_categories(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount DECIMAL(15,2) DEFAULT 0,
  is_projection BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category_id, year, month)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_entries_year ON financial_entries(year);
CREATE INDEX IF NOT EXISTS idx_financial_entries_category ON financial_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_financial_categories_type ON financial_categories(type);

-- Inserir categorias padrão do DRE
INSERT INTO financial_categories (name, type, order_index) VALUES
('Receita Bruta de Serviços', 'revenue', 1),
('(-) Deduções da Receita', 'revenue', 2),
('(=) Receita Líquida de Serviços', 'revenue', 3),
('(-) Custos dos Serviços Prestados', 'cost', 4),
('(=) Lucro Bruto', 'revenue', 5),
('(-) Despesas Operacionais', 'expense', 6),
('(-) Despesas Comerciais', 'expense', 7),
('(-) Despesas Administrativas', 'expense', 8),
('(-) Despesas com Marketing', 'expense', 9),
('(-) Despesas com Pessoal', 'expense', 10),
('(=) Resultado Operacional', 'revenue', 11),
('(-) Despesas Financeiras', 'expense', 12),
('(+) Receitas Financeiras', 'revenue', 13),
('(=) Resultado Antes do IR e CSLI', 'revenue', 14),
('(-) IR e CSLL', 'expense', 15),
('(=) Lucro Líquido', 'revenue', 16);

-- Comentários para documentação
COMMENT ON TABLE financial_categories IS 'Categorias financeiras para DRE (Receitas, Despesas, Custos)';
COMMENT ON TABLE financial_entries IS 'Entradas financeiras mensais por categoria e ano';
COMMENT ON COLUMN financial_categories.type IS 'Tipo: revenue (receita), expense (despesa), cost (custo)';
COMMENT ON COLUMN financial_entries.month IS 'Mês de 1 a 12';
COMMENT ON COLUMN financial_entries.is_projection IS 'Se true, é uma projeção futura';
