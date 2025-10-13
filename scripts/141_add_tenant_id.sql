-- Script para adicionar tenant_id nas tabelas principais
-- Este script implementa multi-tenancy com RLS

-- 1. Adicionar tenant_id na tabela projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES client_companies(id);

-- 2. Adicionar tenant_id na tabela companies (empresas do sistema)
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES client_companies(id);

-- 3. Adicionar tenant_id na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES client_companies(id);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);

-- 5. Comentários para documentação
COMMENT ON COLUMN projects.tenant_id IS 'ID da empresa cliente (tenant) - NULL para admin principal';
COMMENT ON COLUMN companies.tenant_id IS 'ID da empresa cliente (tenant) - NULL para admin principal';
COMMENT ON COLUMN profiles.tenant_id IS 'ID da empresa cliente (tenant) - NULL para admin principal';

-- 6. Verificar se as colunas foram adicionadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('projects', 'companies', 'profiles')
AND column_name = 'tenant_id'
ORDER BY table_name;
