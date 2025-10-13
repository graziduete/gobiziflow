-- Script para verificar triggers na tabela profiles
-- Este script vai mostrar todos os triggers que podem estar alterando dados

-- Verificar triggers na tabela profiles
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- Verificar funções relacionadas
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%profile%' 
   OR routine_name LIKE '%user%'
   OR routine_definition LIKE '%profiles%'
ORDER BY routine_name;

-- Verificar constraints na tabela profiles
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'profiles'
ORDER BY tc.constraint_type, tc.constraint_name;
