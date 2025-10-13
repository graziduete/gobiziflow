-- Script para backup e verificação dos dados existentes
-- Execute este script ANTES de adicionar tenant_id

-- 1. Contar registros existentes por tabela
SELECT 'projects' as table_name, COUNT(*) as record_count FROM projects
UNION ALL
SELECT 'companies' as table_name, COUNT(*) as record_count FROM companies
UNION ALL
SELECT 'estimativas' as table_name, COUNT(*) as record_count FROM estimativas
UNION ALL
SELECT 'tasks' as table_name, COUNT(*) as record_count FROM tasks
UNION ALL
SELECT 'responsaveis' as table_name, COUNT(*) as record_count FROM responsaveis
UNION ALL
SELECT 'revenue_entries' as table_name, COUNT(*) as record_count FROM revenue_entries
UNION ALL
SELECT 'expense_entries' as table_name, COUNT(*) as record_count FROM expense_entries
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
ORDER BY table_name;

-- 2. Verificar se há dados em tabelas críticas
SELECT 
    'projects' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_records
FROM projects
UNION ALL
SELECT 
    'companies' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_records
FROM companies
UNION ALL
SELECT 
    'estimativas' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_records
FROM estimativas;

-- 3. Verificar usuários ativos
SELECT 
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_users
FROM profiles
GROUP BY role
ORDER BY role;
