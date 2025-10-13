-- Script para criar tabela de empresas clientes (MULTI-TENANT)
-- Este script cria a estrutura para gerenciar empresas clientes no sistema

-- 1. Criar tabela client_companies
CREATE TABLE IF NOT EXISTS client_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tipo de cliente
    type VARCHAR(2) NOT NULL CHECK (type IN ('PJ', 'PF')),
    
    -- Dados para Pessoa Jurídica (PJ)
    corporate_name VARCHAR(255),
    cnpj VARCHAR(18),
    
    -- Dados para Pessoa Física (PF)
    full_name VARCHAR(255),
    cpf VARCHAR(14),
    
    -- E-mail de contato (obrigatório para ambos)
    email VARCHAR(255) NOT NULL,
    
    -- Endereço
    cep VARCHAR(9) NOT NULL,
    street VARCHAR(255) NOT NULL,
    number VARCHAR(10) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    
    -- Dados do plano
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('teste_7_dias', 'plano_pro')),
    licenses_quantity INTEGER NOT NULL CHECK (licenses_quantity >= 1 AND licenses_quantity <= 10),
    price_per_license DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    
    -- Dados do cartão
    card_number VARCHAR(19) NOT NULL,
    card_name VARCHAR(100) NOT NULL,
    card_expiry VARCHAR(5) NOT NULL,
    card_cvv VARCHAR(3) NOT NULL,
    
    -- Status da empresa
    status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_client_companies_type ON client_companies(type);
CREATE INDEX IF NOT EXISTS idx_client_companies_email ON client_companies(email);
CREATE INDEX IF NOT EXISTS idx_client_companies_status ON client_companies(status);
CREATE INDEX IF NOT EXISTS idx_client_companies_created_at ON client_companies(created_at);

-- 3. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_client_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_companies_updated_at ON client_companies;
CREATE TRIGGER trigger_update_client_companies_updated_at
    BEFORE UPDATE ON client_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_client_companies_updated_at();

-- 4. Criar RLS (Row Level Security)
ALTER TABLE client_companies ENABLE ROW LEVEL SECURITY;

-- Política para admin_master: pode ver e gerenciar todas as empresas
DROP POLICY IF EXISTS "admin_master_full_access" ON client_companies;
CREATE POLICY "admin_master_full_access" ON client_companies
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin_master'
        )
    );

-- 5. Adicionar comentários para documentação
COMMENT ON TABLE client_companies IS 'Tabela para gerenciar empresas clientes no sistema multi-tenant (COMPLETAMENTE APARTADA do módulo principal)';
COMMENT ON COLUMN client_companies.type IS 'Tipo de cliente: PJ (Pessoa Jurídica) ou PF (Pessoa Física)';
COMMENT ON COLUMN client_companies.plan_type IS 'Tipo de plano: teste_7_dias ou plano_pro';
COMMENT ON COLUMN client_companies.status IS 'Status da empresa: active, inactive ou trial';

-- 6. Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'client_companies' 
ORDER BY ordinal_position;