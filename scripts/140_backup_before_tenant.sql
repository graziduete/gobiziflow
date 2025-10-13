-- Script de backup antes de adicionar tenant_id
-- Execute este script ANTES do script 141

-- 1. Criar backup das tabelas críticas
CREATE TABLE IF NOT EXISTS projects_backup_tenant AS SELECT * FROM projects;
CREATE TABLE IF NOT EXISTS companies_backup_tenant AS SELECT * FROM companies;
CREATE TABLE IF NOT EXISTS profiles_backup_tenant AS SELECT * FROM profiles;

-- 2. Verificar se os backups foram criados
SELECT 
    'projects_backup_tenant' as table_name, COUNT(*) as records
FROM projects_backup_tenant
UNION ALL
SELECT 
    'companies_backup_tenant' as table_name, COUNT(*) as records
FROM companies_backup_tenant
UNION ALL
SELECT 
    'profiles_backup_tenant' as table_name, COUNT(*) as records
FROM profiles_backup_tenant;

-- 3. Comentários para documentação
COMMENT ON TABLE projects_backup_tenant IS 'Backup da tabela projects antes de adicionar tenant_id';
COMMENT ON TABLE companies_backup_tenant IS 'Backup da tabela companies antes de adicionar tenant_id';
COMMENT ON TABLE profiles_backup_tenant IS 'Backup da tabela profiles antes de adicionar tenant_id';
