-- Script para verificar TODOS os campos da tabela projects no Supabase
-- Execute este script no SQL Editor do Supabase para ver a estrutura completa

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'projects'
ORDER BY ordinal_position;

-- Este comando mostrará TODOS os campos que existem na tabela projects

