-- Script de rollback corrigido para reverter alterações de tenant_id
-- Este script remove políticas RLS primeiro, depois as colunas

-- 1. Remover políticas RLS primeiro
DROP POLICY IF EXISTS "projects_tenant_isolation" ON projects;
DROP POLICY IF EXISTS "companies_tenant_isolation" ON companies;
DROP POLICY IF EXISTS "profiles_tenant_isolation" ON profiles;

-- 2. Desabilitar RLS nas tabelas
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Remover coluna tenant_id das tabelas (agora sem dependências)
ALTER TABLE projects DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE companies DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS tenant_id;

-- 4. Remover índices relacionados ao tenant_id
DROP INDEX IF EXISTS idx_projects_tenant_id;
DROP INDEX IF EXISTS idx_companies_tenant_id;
DROP INDEX IF EXISTS idx_profiles_tenant_id;

-- 5. Verificar se as colunas foram removidas
SELECT 
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_name IN ('projects', 'companies', 'profiles')
AND column_name = 'tenant_id'
ORDER BY table_name;

-- 6. Verificar se RLS está desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('projects', 'companies', 'profiles')
AND schemaname = 'public'
ORDER BY tablename;

-- 7. Verificar se tudo foi revertido
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

-- 8. Comentários para documentação
COMMENT ON TABLE projects_backup_tenant IS 'Backup da tabela projects antes de adicionar tenant_id';
COMMENT ON TABLE companies_backup_tenant IS 'Backup da tabela companies antes de adicionar tenant_id';
COMMENT ON TABLE profiles_backup_tenant IS 'Backup da tabela profiles antes de adicionar tenant_id';
