-- Script para verificar a estrutura da tabela client_admins
-- Este script vai mostrar se a tabela existe e qual é sua estrutura

-- 1. Verificar se a tabela client_admins existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'client_admins'
AND table_schema = 'public';

-- 2. Verificar a estrutura da tabela client_admins
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'client_admins'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar constraints da tabela
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'client_admins'
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type;

-- 4. Verificar se há dados na tabela
SELECT COUNT(*) as total_records FROM client_admins;

-- 5. Verificar RLS (Row Level Security) na tabela
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'client_admins';
