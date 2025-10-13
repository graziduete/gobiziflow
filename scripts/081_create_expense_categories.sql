-- Script: 081_create_expense_categories.sql
-- Módulo Financeiro - Categorias e Subcategorias de Despesas
-- Criado em: 2024-12-19
-- Descrição: Tabelas para gestão de categorias e subcategorias de despesas

-- Tabela de categorias de despesas
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50) NOT NULL DEFAULT 'blue',
  icon VARCHAR(50) NOT NULL DEFAULT 'Building2',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de subcategorias de despesas
CREATE TABLE IF NOT EXISTS expense_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de entradas de despesas (valores mensais por subcategoria)
CREATE TABLE IF NOT EXISTS expense_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES expense_subcategories(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount DECIMAL(15,2) DEFAULT 0,
  is_projection BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subcategory_id, year, month)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_expense_subcategories_category ON expense_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_subcategories_active ON expense_subcategories(is_active);
CREATE INDEX IF NOT EXISTS idx_expense_entries_year ON expense_entries(year);
CREATE INDEX IF NOT EXISTS idx_expense_entries_month ON expense_entries(month);
CREATE INDEX IF NOT EXISTS idx_expense_entries_subcategory ON expense_entries(subcategory_id);

-- Inserir categorias padrão de despesas
INSERT INTO expense_categories (name, description, color, icon, order_index) VALUES
('Escritório', 'Despesas relacionadas ao escritório', 'blue', 'Building2', 1),
('Software e Serviços', 'Assinaturas e serviços digitais', 'green', 'Laptop', 2),
('Alimentação e Veículos', 'Despesas com alimentação e transporte', 'orange', 'Car', 3),
('Profissionais', 'Honorários e serviços profissionais', 'purple', 'Briefcase', 4),
('RDI - Reembolso de Despesas', 'Reembolso de despesas por prestador de serviço', 'red', 'Receipt', 5),
('Impostos', 'Impostos e taxas governamentais', 'red', 'Banknote', 6);

-- Inserir subcategorias padrão
-- Escritório
INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Aluguel do Escritório', 'Aluguel mensal do espaço físico'
FROM expense_categories c WHERE c.name = 'Escritório';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Condomínio', 'Taxa de condomínio'
FROM expense_categories c WHERE c.name = 'Escritório';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Conta de Luz (Enel)', 'Conta de energia elétrica'
FROM expense_categories c WHERE c.name = 'Escritório';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Internet/Telefone (Vivo)', 'Serviços de telecomunicação'
FROM expense_categories c WHERE c.name = 'Escritório';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Limpeza', 'Serviços de limpeza'
FROM expense_categories c WHERE c.name = 'Escritório';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Segurança (Verisure)', 'Sistema de segurança'
FROM expense_categories c WHERE c.name = 'Escritório';

-- Software e Serviços
INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'GSuite', 'Assinatura do Google Workspace'
FROM expense_categories c WHERE c.name = 'Software e Serviços';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'D4Sign', 'Assinatura do D4Sign'
FROM expense_categories c WHERE c.name = 'Software e Serviços';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'AWS - Amazon', 'Serviços de cloud da Amazon'
FROM expense_categories c WHERE c.name = 'Software e Serviços';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, '2Captcha', 'Serviço de captcha'
FROM expense_categories c WHERE c.name = 'Software e Serviços';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Apple', 'Serviços da Apple'
FROM expense_categories c WHERE c.name = 'Software e Serviços';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'LinkedIn', 'Assinatura do LinkedIn'
FROM expense_categories c WHERE c.name = 'Software e Serviços';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Norton', 'Antivírus Norton'
FROM expense_categories c WHERE c.name = 'Software e Serviços';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Github', 'Assinatura do GitHub'
FROM expense_categories c WHERE c.name = 'Software e Serviços';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Microsoft - Marketup', 'Serviços da Microsoft'
FROM expense_categories c WHERE c.name = 'Software e Serviços';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Club Endereço Fiscal', 'Serviço de endereço fiscal'
FROM expense_categories c WHERE c.name = 'Software e Serviços';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Ventura Contabilidade', 'Serviços contábeis'
FROM expense_categories c WHERE c.name = 'Software e Serviços';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Quartier', 'Serviço Quartier'
FROM expense_categories c WHERE c.name = 'Software e Serviços';

-- Alimentação e Veículos
INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Alimentação', 'Despesas com alimentação'
FROM expense_categories c WHERE c.name = 'Alimentação e Veículos';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Veículos e Voos', 'Despesas com transporte'
FROM expense_categories c WHERE c.name = 'Alimentação e Veículos';

-- Profissionais
INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Advogado (Camila Zerbini)', 'Honorários advocatícios'
FROM expense_categories c WHERE c.name = 'Profissionais';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Arquiteto (Beatriz Tesch)', 'Serviços de arquitetura'
FROM expense_categories c WHERE c.name = 'Profissionais';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Outros Profissionais', 'Outros serviços profissionais'
FROM expense_categories c WHERE c.name = 'Profissionais';

-- RDI - Reembolso de Despesas
INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Coop Luiz Alencar', 'Reembolso para Luiz Alencar'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Graziely Duete', 'Reembolso para Graziely Duete'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Leonardo Firmino', 'Reembolso para Leonardo Firmino'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Gustavo Henrique', 'Reembolso para Gustavo Henrique'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Guilherme Araujo', 'Reembolso para Guilherme Araujo'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Mateus Moura', 'Reembolso para Mateus Moura'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Victor Moreira', 'Reembolso para Victor Moreira'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Thaisa Cazassa', 'Reembolso para Thaisa Cazassa'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Henrique Rodrigues', 'Reembolso para Henrique Rodrigues'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Diego Diogenes', 'Reembolso para Diego Diogenes'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Pedro Pacheco', 'Reembolso para Pedro Pacheco'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Bruno Antoniazzi', 'Reembolso para Bruno Antoniazzi'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Paulo Pontes', 'Reembolso para Paulo Pontes'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Vitor Pinheiro', 'Reembolso para Vitor Pinheiro'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Allan Calisto', 'Reembolso para Allan Calisto'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'Flávia Biazini', 'Reembolso para Flávia Biazini'
FROM expense_categories c WHERE c.name = 'RDI - Reembolso de Despesas';

-- Impostos
INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'DANF', 'Documento de Arrecadação de Receitas Federais'
FROM expense_categories c WHERE c.name = 'Impostos';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'TFE', 'Taxa de Fiscalização de Estabelecimentos'
FROM expense_categories c WHERE c.name = 'Impostos';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'DAS', 'Documento de Arrecadação do Simples Nacional'
FROM expense_categories c WHERE c.name = 'Impostos';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'IRPJ', 'Imposto de Renda Pessoa Jurídica'
FROM expense_categories c WHERE c.name = 'Impostos';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'CSLL', 'Contribuição Social sobre o Lucro Líquido'
FROM expense_categories c WHERE c.name = 'Impostos';

INSERT INTO expense_subcategories (category_id, name, description) 
SELECT c.id, 'ISS', 'Imposto sobre Serviços'
FROM expense_categories c WHERE c.name = 'Impostos';

-- Comentários para documentação
COMMENT ON TABLE expense_categories IS 'Categorias principais de despesas (Escritório, Software, etc.)';
COMMENT ON TABLE expense_subcategories IS 'Subcategorias específicas dentro de cada categoria';
COMMENT ON TABLE expense_entries IS 'Valores mensais de despesas por subcategoria';
COMMENT ON COLUMN expense_categories.color IS 'Cor da categoria para interface (blue, green, orange, etc.)';
COMMENT ON COLUMN expense_categories.icon IS 'Ícone da categoria para interface (Building2, Laptop, etc.)';
COMMENT ON COLUMN expense_categories.order_index IS 'Ordem de exibição das categorias na interface';
COMMENT ON COLUMN expense_entries.month IS 'Mês de 1 a 12';
COMMENT ON COLUMN expense_entries.is_projection IS 'Se true, é uma projeção futura';
