-- Script para verificar TODOS os campos da tabela TASKS no Supabase
-- Execute este script no SQL Editor do Supabase para ver a estrutura completa

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('start_date', 'end_date', 'original_end_date', 'actual_end_date') THEN '📅 DATA'
        WHEN column_name IN ('delay_justification') THEN '📝 JUSTIFICATIVA'
        ELSE ''
    END as tipo
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Este comando mostrará TODOS os campos que existem na tabela tasks

