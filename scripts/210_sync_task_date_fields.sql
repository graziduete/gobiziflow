-- =====================================================
-- Script: 210_sync_task_date_fields.sql
-- Descrição: Documentar campos de datas que já existem no banco
-- Data: 2025-11-07
-- Objetivo: Sincronizar documentação com estado atual do banco
-- =====================================================

-- IMPORTANTE: Este script documenta os campos que JÁ EXISTEM
-- Estes campos foram adicionados manualmente no Supabase
-- Executar este script garante que outro ambiente terá os mesmos campos

-- =====================================================
-- CAMPOS JÁ EXISTENTES (confirmado via Supabase):
-- =====================================================
-- start_date            DATE  -- Data de início prevista
-- end_date              DATE  -- Data de término prevista
-- original_end_date     DATE  -- Data fim planejada original
-- actual_start_date     DATE  -- Data início REAL
-- actual_end_date       DATE  -- Data fim REAL
-- predicted_end_date    DATE  -- Data fim prevista (atualizada)
-- delay_justification   TEXT  -- Justificativa de atraso
-- dependency_type       VARCHAR -- Tipo de dependência
-- predecessor_task_id   UUID  -- Tarefa predecessora
-- =====================================================

-- 1. Adicionar campos de datas que faltam (IF NOT EXISTS para segurança)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_start_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS predicted_end_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependency_type VARCHAR(50) DEFAULT 'independent';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS predecessor_task_id UUID;

-- 2. Adicionar comentários para documentação
COMMENT ON COLUMN tasks.start_date IS 'Data de início prevista da tarefa';
COMMENT ON COLUMN tasks.end_date IS 'Data de término prevista da tarefa';
COMMENT ON COLUMN tasks.original_end_date IS 'Data de fim originalmente planejada (antes de qualquer mudança)';
COMMENT ON COLUMN tasks.actual_start_date IS 'Data de início REAL da tarefa (quando realmente começou)';
COMMENT ON COLUMN tasks.actual_end_date IS 'Data de fim REAL da tarefa (quando realmente terminou)';
COMMENT ON COLUMN tasks.predicted_end_date IS 'Data de fim prevista atualizada (última estimativa)';
COMMENT ON COLUMN tasks.dependency_type IS 'Tipo de dependência: independent, finish_to_start, start_to_start, etc';
COMMENT ON COLUMN tasks.predecessor_task_id IS 'ID da tarefa predecessora (se houver dependência)';

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tasks_actual_start_date ON tasks(actual_start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_predicted_end_date ON tasks(predicted_end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_predecessor ON tasks(predecessor_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_dependency_type ON tasks(dependency_type);

-- 4. Adicionar Foreign Key para predecessor_task_id (referência à própria tabela)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_tasks_predecessor'
    ) THEN
        ALTER TABLE tasks 
        ADD CONSTRAINT fk_tasks_predecessor 
        FOREIGN KEY (predecessor_task_id) 
        REFERENCES tasks(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Verificação final da estrutura
SELECT 
    'VERIFICAÇÃO FINAL' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('start_date', 'end_date', 'original_end_date', 'actual_start_date', 'actual_end_date', 'predicted_end_date') THEN '📅 DATA'
        WHEN column_name IN ('delay_justification') THEN '📝 JUSTIFICATIVA'
        WHEN column_name IN ('dependency_type', 'predecessor_task_id') THEN '🔗 DEPENDÊNCIA'
        ELSE ''
    END as tipo
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN (
    'start_date',
    'end_date',
    'original_end_date',
    'actual_start_date',
    'actual_end_date',
    'predicted_end_date',
    'delay_justification',
    'dependency_type',
    'predecessor_task_id'
)
ORDER BY 
    CASE column_name
        WHEN 'start_date' THEN 1
        WHEN 'end_date' THEN 2
        WHEN 'original_end_date' THEN 3
        WHEN 'predicted_end_date' THEN 4
        WHEN 'actual_start_date' THEN 5
        WHEN 'actual_end_date' THEN 6
        WHEN 'delay_justification' THEN 7
        WHEN 'dependency_type' THEN 8
        WHEN 'predecessor_task_id' THEN 9
    END;

-- 6. Estatísticas de uso
SELECT 
    'ESTATÍSTICAS DE USO' as info,
    COUNT(*) as total_tasks,
    COUNT(actual_start_date) as tasks_com_data_inicio_real,
    COUNT(actual_end_date) as tasks_com_data_fim_real,
    COUNT(predicted_end_date) as tasks_com_data_prevista,
    COUNT(CASE WHEN dependency_type != 'independent' THEN 1 END) as tasks_com_dependencia,
    COUNT(predecessor_task_id) as tasks_com_predecessora
FROM tasks;

