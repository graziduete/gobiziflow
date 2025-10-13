-- Script para verificar a estrutura da tabela client_admins
-- Este script vai mostrar exatamente qual é a estrutura da tabela

-- 1. Verificar estrutura completa da tabela
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

-- 2. Verificar constraints específicas
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'client_admins'
AND tc.table_schema = 'public';

-- 3. Verificar se há dados existentes
SELECT * FROM client_admins LIMIT 5;

-- 4. Verificar RLS e políticas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'client_admins';

-- 5. Verificar políticas RLS específicas
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'client_admins';
