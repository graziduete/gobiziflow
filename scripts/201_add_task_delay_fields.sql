-- =====================================================
-- Script: 201_add_task_delay_fields.sql
-- Descrição: Adicionar campos para justificativa de atraso em tarefas
-- Data: 2025-01-15
-- Objetivo: Preparar estrutura para funcionalidade de justificativa de atraso
-- ROLLBACK: 202_rollback_task_delay_fields.sql
-- =====================================================

-- =====================================================
-- IMPORTANTE: Este script é SEGURO para produção
-- - Usa IF NOT EXISTS para evitar erros
-- - Campos opcionais (NULL por padrão)
-- - Não modifica dados existentes
-- - Mantém todas as constraints atuais
-- =====================================================

-- 1. Adicionar campos para justificativa de atraso
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delay_justification TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS original_end_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_end_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delay_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS delay_created_by UUID;

-- 2. Adicionar comentários para documentação
COMMENT ON COLUMN tasks.delay_justification IS 'Justificativa obrigatória quando status = completed_delayed';
COMMENT ON COLUMN tasks.original_end_date IS 'Data de fim originalmente planejada';
COMMENT ON COLUMN tasks.actual_end_date IS 'Data de fim real quando houve atraso';
COMMENT ON COLUMN tasks.delay_created_at IS 'Data/hora quando o atraso foi registrado';
COMMENT ON COLUMN tasks.delay_created_by IS 'ID do usuário que registrou o atraso (sem FK para evitar problemas)';

-- 3. Criar índices para performance (opcional)
CREATE INDEX IF NOT EXISTS idx_tasks_delay_created_at ON tasks(delay_created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_delay_created_by ON tasks(delay_created_by);

-- 4. Verificação final da estrutura
SELECT 
    'VERIFICAÇÃO FINAL' as info,
    'tasks' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
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

-- 5. Verificar se os campos foram criados corretamente
SELECT 
    'ESTRUTURA ATUALIZADA' as status,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN delay_justification IS NOT NULL THEN 1 END) as tasks_with_delay_justification,
    COUNT(CASE WHEN original_end_date IS NOT NULL THEN 1 END) as tasks_with_original_end_date,
    COUNT(CASE WHEN actual_end_date IS NOT NULL THEN 1 END) as tasks_with_actual_end_date
FROM tasks;
