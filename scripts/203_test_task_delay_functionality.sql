-- =====================================================
-- Script: 203_test_task_delay_functionality.sql
-- Descrição: Teste de funcionalidade de justificativa de atraso
-- Data: 2025-01-15
-- Objetivo: Validar se os campos foram criados corretamente
-- =====================================================

-- =====================================================
-- TESTE 1: Verificar se os campos existem
-- =====================================================
SELECT 
    'TESTE 1 - VERIFICAÇÃO DE CAMPOS' as teste,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ TODOS OS CAMPOS CRIADOS'
        ELSE '❌ CAMPOS FALTANDO'
    END as resultado,
    COUNT(*) as campos_encontrados
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN (
    'delay_justification',
    'original_end_date', 
    'actual_end_date',
    'delay_created_at',
    'delay_created_by'
);

-- =====================================================
-- TESTE 2: Verificar tipos de dados corretos
-- =====================================================
SELECT 
    'TESTE 2 - VERIFICAÇÃO DE TIPOS' as teste,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'delay_justification' AND data_type = 'text' THEN '✅'
        WHEN column_name = 'original_end_date' AND data_type = 'date' THEN '✅'
        WHEN column_name = 'actual_end_date' AND data_type = 'date' THEN '✅'
        WHEN column_name = 'delay_created_at' AND data_type = 'timestamp with time zone' THEN '✅'
        WHEN column_name = 'delay_created_by' AND data_type = 'uuid' THEN '✅'
        ELSE '❌'
    END as tipo_correto
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN (
    'delay_justification',
    'original_end_date', 
    'actual_end_date',
    'delay_created_at',
    'delay_created_by'
)
ORDER BY column_name;

-- =====================================================
-- TESTE 3: Verificar se campos aceitam NULL (devem aceitar)
-- =====================================================
SELECT 
    'TESTE 3 - VERIFICAÇÃO NULL' as teste,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ TODOS OS CAMPOS ACEITAM NULL'
        ELSE '❌ ALGUM CAMPO NÃO ACEITA NULL'
    END as resultado
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN (
    'delay_justification',
    'original_end_date', 
    'actual_end_date',
    'delay_created_at',
    'delay_created_by'
)
AND is_nullable = 'YES';

-- =====================================================
-- TESTE 4: Verificar que NÃO há foreign key para delay_created_by
-- =====================================================
SELECT 
    'TESTE 4 - VERIFICAÇÃO SEM FK' as teste,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SEM FOREIGN KEY (CORRETO)'
        ELSE '❌ FOREIGN KEY ENCONTRADA (PROBLEMA)'
    END as resultado
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'tasks'
AND kcu.column_name = 'delay_created_by'
AND tc.constraint_type = 'FOREIGN KEY';

-- =====================================================
-- TESTE 5: Verificar índices criados
-- =====================================================
SELECT 
    'TESTE 5 - VERIFICAÇÃO ÍNDICES' as teste,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ ÍNDICES CRIADOS'
        ELSE '❌ ÍNDICES FALTANDO'
    END as resultado,
    COUNT(*) as indices_encontrados
FROM pg_indexes 
WHERE tablename = 'tasks'
AND indexname IN (
    'idx_tasks_delay_created_at',
    'idx_tasks_delay_created_by'
);

-- =====================================================
-- TESTE 6: Teste de inserção (simulação)
-- =====================================================
-- Este teste simula uma inserção para verificar se tudo funciona
DO $$
DECLARE
    test_task_id UUID;
    test_user_id UUID;
BEGIN
    -- Buscar um usuário existente para o teste
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Buscar uma tarefa existente para teste
        SELECT id INTO test_task_id FROM tasks LIMIT 1;
        
        IF test_task_id IS NOT NULL THEN
            -- Atualizar tarefa com dados de teste
            UPDATE tasks SET 
                delay_justification = 'Teste de funcionalidade',
                original_end_date = '2025-01-10',
                actual_end_date = '2025-01-15',
                delay_created_at = NOW(),
                delay_created_by = test_user_id
            WHERE id = test_task_id;
            
            RAISE NOTICE 'TESTE 6 - ✅ ATUALIZAÇÃO REALIZADA COM SUCESSO';
            
            -- Limpar dados de teste
            UPDATE tasks SET 
                delay_justification = NULL,
                original_end_date = NULL,
                actual_end_date = NULL,
                delay_created_at = NULL,
                delay_created_by = NULL
            WHERE id = test_task_id;
            
            RAISE NOTICE 'TESTE 6 - ✅ DADOS DE TESTE REMOVIDOS';
        ELSE
            RAISE NOTICE 'TESTE 6 - ⚠️ NENHUMA TAREFA ENCONTRADA PARA TESTE';
        END IF;
    ELSE
        RAISE NOTICE 'TESTE 6 - ⚠️ NENHUM USUÁRIO ENCONTRADO PARA TESTE';
    END IF;
END $$;

-- =====================================================
-- RESUMO FINAL
-- =====================================================
SELECT 
    'RESUMO FINAL' as info,
    'Se todos os testes acima mostraram ✅, a funcionalidade está pronta!' as mensagem,
    'Caso contrário, execute o rollback: 202_rollback_task_delay_fields.sql' as rollback_info;
