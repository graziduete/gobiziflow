-- Script para criar tabela de administradores de empresas clientes
-- Esta tabela armazena os administradores específicos de cada empresa cliente

-- 1. Criar tabela client_admins
CREATE TABLE IF NOT EXISTS client_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referência à empresa cliente
    company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
    
    -- Dados do administrador
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Status do administrador
    status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(company_id, email) -- Um email só pode ser admin de uma empresa
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_client_admins_company_id ON client_admins(company_id);
CREATE INDEX IF NOT EXISTS idx_client_admins_email ON client_admins(email);
CREATE INDEX IF NOT EXISTS idx_client_admins_status ON client_admins(status);
CREATE INDEX IF NOT EXISTS idx_client_admins_created_at ON client_admins(created_at);

-- 3. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_client_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_admins_updated_at ON client_admins;
CREATE TRIGGER trigger_update_client_admins_updated_at
    BEFORE UPDATE ON client_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_client_admins_updated_at();

-- 4. Criar RLS (Row Level Security)
ALTER TABLE client_admins ENABLE ROW LEVEL SECURITY;

-- Política para admin_master: pode ver e gerenciar todos os admins
DROP POLICY IF EXISTS "admin_master_full_access" ON client_admins;
CREATE POLICY "admin_master_full_access" ON client_admins
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin_master'
        )
    );

-- Política para client_admin: pode ver apenas os admins da sua empresa
DROP POLICY IF EXISTS "client_admin_company_access" ON client_admins;
CREATE POLICY "client_admin_company_access" ON client_admins
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'client_admin'
            AND profiles.company_id = client_admins.company_id
        )
    );

-- 5. Adicionar comentários para documentação
COMMENT ON TABLE client_admins IS 'Tabela para gerenciar administradores de empresas clientes';
COMMENT ON COLUMN client_admins.company_id IS 'Referência à empresa cliente';
COMMENT ON COLUMN client_admins.status IS 'Status do administrador: active ou inactive';
