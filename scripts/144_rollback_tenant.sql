-- Script de rollback para reverter alterações de tenant_id
-- Execute este script APENAS se algo der errado após o script 141

-- 1. Remover coluna tenant_id das tabelas
ALTER TABLE projects DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE companies DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS tenant_id;

-- 2. Remover índices relacionados ao tenant_id
DROP INDEX IF EXISTS idx_projects_tenant_id;
DROP INDEX IF EXISTS idx_companies_tenant_id;
DROP INDEX IF EXISTS idx_profiles_tenant_id;

-- 3. Verificar se as colunas foram removidas
SELECT 
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_name IN ('projects', 'companies', 'profiles')
AND column_name = 'tenant_id'
ORDER BY table_name;

-- 4. Restaurar dados dos backups (se necessário)
-- Descomente as linhas abaixo apenas se precisar restaurar dados
/*
TRUNCATE TABLE projects;
INSERT INTO projects SELECT * FROM projects_backup_tenant;

TRUNCATE TABLE companies;
INSERT INTO companies SELECT * FROM companies_backup_tenant;

TRUNCATE TABLE profiles;
INSERT INTO profiles SELECT * FROM profiles_backup_tenant;
*/

-- 5. Verificar se tudo foi revertido
SELECT 
    'projects' as table_name, COUNT(*) as records
FROM projects
UNION ALL
SELECT 
    'companies' as table_name, COUNT(*) as records
FROM companies
UNION ALL
SELECT 
    'profiles' as table_name, COUNT(*) as records
FROM profiles;

-- 6. Comentários para documentação
COMMENT ON TABLE projects_backup_tenant IS 'Backup da tabela projects antes de adicionar tenant_id';
COMMENT ON TABLE companies_backup_tenant IS 'Backup da tabela companies antes de adicionar tenant_id';
COMMENT ON TABLE profiles_backup_tenant IS 'Backup da tabela profiles antes de adicionar tenant_id';
