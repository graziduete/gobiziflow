-- =====================================================
-- Script: 202_rollback_task_delay_fields.sql
-- Descrição: ROLLBACK - Remover campos de justificativa de atraso em tarefas
-- Data: 2025-01-15
-- Objetivo: Reverter script 201_add_task_delay_fields.sql
-- USAR APENAS EM CASO DE PROBLEMAS
-- =====================================================

-- =====================================================
-- ⚠️ ATENÇÃO: Este script REMOVE os campos adicionados
-- - Removerá todos os dados de justificativa de atraso
-- - Esta ação NÃO PODE SER DESFEITA
-- - Execute apenas se houver problemas críticos
-- =====================================================

-- 1. Verificar dados que serão perdidos ANTES de remover
SELECT 
    'DADOS QUE SERÃO PERDIDOS' as warning,
    COUNT(*) as total_tasks_with_delay_data,
    COUNT(CASE WHEN delay_justification IS NOT NULL THEN 1 END) as tasks_with_justification,
    COUNT(CASE WHEN original_end_date IS NOT NULL THEN 1 END) as tasks_with_original_date,
    COUNT(CASE WHEN actual_end_date IS NOT NULL THEN 1 END) as tasks_with_actual_date
FROM tasks
WHERE delay_justification IS NOT NULL 
   OR original_end_date IS NOT NULL 
   OR actual_end_date IS NOT NULL 
   OR delay_created_at IS NOT NULL 
   OR delay_created_by IS NOT NULL;

-- 2. Fazer backup dos dados antes de remover (opcional)
-- CREATE TABLE tasks_delay_backup AS 
-- SELECT id, delay_justification, original_end_date, actual_end_date, delay_created_at, delay_created_by
-- FROM tasks
-- WHERE delay_justification IS NOT NULL 
--    OR original_end_date IS NOT NULL 
--    OR actual_end_date IS NOT NULL 
--    OR delay_created_at IS NOT NULL 
--    OR delay_created_by IS NOT NULL;

-- 3. Remover índices primeiro
DROP INDEX IF EXISTS idx_tasks_delay_created_at;
DROP INDEX IF EXISTS idx_tasks_delay_created_by;

-- 4. Remover comentários
COMMENT ON COLUMN tasks.delay_justification IS NULL;
COMMENT ON COLUMN tasks.original_end_date IS NULL;
COMMENT ON COLUMN tasks.actual_end_date IS NULL;
COMMENT ON COLUMN tasks.delay_created_at IS NULL;
COMMENT ON COLUMN tasks.delay_created_by IS NULL;

-- 5. Remover colunas (dados serão perdidos permanentemente)
ALTER TABLE tasks DROP COLUMN IF EXISTS delay_justification;
ALTER TABLE tasks DROP COLUMN IF EXISTS original_end_date;
ALTER TABLE tasks DROP COLUMN IF EXISTS actual_end_date;
ALTER TABLE tasks DROP COLUMN IF EXISTS delay_created_at;
ALTER TABLE tasks DROP COLUMN IF EXISTS delay_created_by;

-- 6. Verificação final
SELECT 
    'ROLLBACK COMPLETO' as status,
    'Campos de justificativa de atraso removidos' as message;

-- 7. Verificar estrutura final
SELECT 
    'ESTRUTURA APÓS ROLLBACK' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN (
    'delay_justification',
    'original_end_date', 
    'actual_end_date',
    'delay_created_at',
    'delay_created_by'
);

-- Se não retornar nenhuma linha, o rollback foi bem-sucedido
