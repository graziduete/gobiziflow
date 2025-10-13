-- Script para criar tabela de administradores de empresas clientes (MULTI-TENANT)
-- Este script cria a estrutura para gerenciar administradores das empresas clientes

-- 1. Criar tabela client_admins
CREATE TABLE IF NOT EXISTS client_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Referência à empresa
    company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
    
    -- Dados do administrador
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    
    -- Status do administrador
    status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Política para admin_master: pode ver e gerenciar todos os administradores
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

-- 5. Criar constraint para validar limite de licenças (opcional - pode ser feita na aplicação)
-- Esta constraint garante que não seja possível criar mais administradores que o limite de licenças
-- Comentada por enquanto para permitir flexibilidade na aplicação
/*
CREATE OR REPLACE FUNCTION check_license_limit()
RETURNS TRIGGER AS $$
DECLARE
    company_licenses INTEGER;
    current_admins INTEGER;
BEGIN
    -- Buscar quantidade de licenças da empresa
    SELECT licenses_quantity INTO company_licenses
    FROM client_companies 
    WHERE id = NEW.company_id;
    
    -- Contar administradores ativos da empresa
    SELECT COUNT(*) INTO current_admins
    FROM client_admins 
    WHERE company_id = NEW.company_id AND status = 'active';
    
    -- Se é um novo registro ativo ou está ativando um existente
    IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR 
       (TG_OP = 'UPDATE' AND OLD.status = 'inactive' AND NEW.status = 'active') THEN
        
        -- Verificar se excede o limite
        IF current_admins >= company_licenses THEN
            RAISE EXCEPTION 'Limite de licenças atingido para esta empresa. Licenças contratadas: %', company_licenses;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_license_limit ON client_admins;
CREATE TRIGGER trigger_check_license_limit
    BEFORE INSERT OR UPDATE ON client_admins
    FOR EACH ROW
    EXECUTE FUNCTION check_license_limit();
*/

-- 6. Adicionar comentários para documentação
COMMENT ON TABLE client_admins IS 'Tabela para gerenciar administradores das empresas clientes (COMPLETAMENTE APARTADA do módulo principal)';
COMMENT ON COLUMN client_admins.company_id IS 'Referência à empresa cliente';
COMMENT ON COLUMN client_admins.email IS 'E-mail único do administrador';
COMMENT ON COLUMN client_admins.status IS 'Status do administrador: active ou inactive';

-- 7. Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'client_admins' 
ORDER BY ordinal_position;
