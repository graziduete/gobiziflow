-- Script para investigar triggers na tabela profiles
-- Este script vai mostrar todos os triggers e funções que podem estar alterando dados

-- 1. Verificar triggers na tabela profiles
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 2. Verificar funções que podem estar relacionadas
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%profiles%'
   OR routine_name LIKE '%profile%'
   OR routine_name LIKE '%user%'
ORDER BY routine_name;

-- 3. Verificar se há alguma função específica para criação de usuários
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%INSERT%profiles%'
   OR routine_definition LIKE '%role%'
ORDER BY routine_name;
