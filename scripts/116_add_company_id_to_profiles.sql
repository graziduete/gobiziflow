-- Script para adicionar coluna company_id na tabela profiles
-- Esta coluna é necessária para relacionar usuários com empresas

-- 1. Adicionar coluna company_id na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company_id UUID;

-- 2. Adicionar comentário na coluna
COMMENT ON COLUMN profiles.company_id IS 'ID da empresa associada ao usuário (para client_admins e clientes)';

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);

-- 4. Criar foreign key para client_companies (opcional, mas recomendado)
-- ALTER TABLE profiles 
-- ADD CONSTRAINT fk_profiles_company_id 
-- FOREIGN KEY (company_id) REFERENCES client_companies(id) ON DELETE SET NULL;

-- 5. Verificar se a coluna foi criada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'company_id';
