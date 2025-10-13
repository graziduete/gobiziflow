-- Script para criar tabelas no schema do tenant
-- Este script copia a estrutura das tabelas companies e profiles para o schema do tenant

-- 1. Criar tabela companies no schema do tenant (baseada na estrutura de client_companies)
CREATE TABLE IF NOT EXISTS tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela profiles no schema do tenant (baseada na estrutura de profiles)
CREATE TABLE IF NOT EXISTS tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.profiles (
    id UUID PRIMARY KEY,
    full_name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'client',
    company_id UUID REFERENCES tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.companies(id),
    is_client_admin BOOLEAN DEFAULT FALSE,
    first_login_completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tenant_companies_email 
ON tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.companies(email);

CREATE INDEX IF NOT EXISTS idx_tenant_profiles_email 
ON tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.profiles(email);

CREATE INDEX IF NOT EXISTS idx_tenant_profiles_company_id 
ON tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.profiles(company_id);

CREATE INDEX IF NOT EXISTS idx_tenant_profiles_role 
ON tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.profiles(role);

-- 4. Criar triggers para updated_at
CREATE OR REPLACE FUNCTION update_tenant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tenant_companies_updated_at 
ON tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.companies;

CREATE TRIGGER trigger_update_tenant_companies_updated_at
    BEFORE UPDATE ON tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_updated_at();

DROP TRIGGER IF EXISTS trigger_update_tenant_profiles_updated_at 
ON tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.profiles;

CREATE TRIGGER trigger_update_tenant_profiles_updated_at
    BEFORE UPDATE ON tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_updated_at();

-- 5. Comentários para documentação
COMMENT ON TABLE tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.companies IS 'Tabela de empresas no schema do tenant Agile Point';
COMMENT ON TABLE tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2.profiles IS 'Tabela de perfis no schema do tenant Agile Point';

-- 6. Verificar se as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'tenant_1aad7589_6ec0_48c1_b192_5cbe1f3193f2'
ORDER BY tablename;
