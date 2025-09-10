-- Adicionar campo order na tabela tasks
-- Data: 2024-12-19

-- Adicionar coluna order na tabela tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Comentário da coluna
COMMENT ON COLUMN tasks."order" IS 'Ordem de exibição das tarefas no projeto';

-- Atualizar tarefas existentes para ter ordem baseada na data de criação
UPDATE tasks 
SET "order" = subquery.row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) as row_number
  FROM tasks
) AS subquery
WHERE tasks.id = subquery.id;

-- Criar índice para melhor performance nas consultas ordenadas
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(project_id, "order");

-- Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name = 'order';