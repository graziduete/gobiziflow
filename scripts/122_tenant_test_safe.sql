-- TESTE SEGURO: Adicionar tenant_id em uma tabela de teste
-- Este script adiciona tenant_id em uma tabela não-crítica para testar

-- 1. Verificar se a tabela existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar tenant_id na tabela projects (se existir)
-- ATENÇÃO: Execute apenas se a tabela projects existir
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 3. Adicionar comentário
-- COMMENT ON COLUMN projects.tenant_id IS 'ID do tenant (client_company) para isolamento multi-tenant';

-- 4. Criar índice
-- CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);

-- 5. Verificar se foi adicionado
-- SELECT 
--     column_name,
--     data_type,
--     is_nullable,
--     column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'projects' 
-- AND column_name = 'tenant_id';
