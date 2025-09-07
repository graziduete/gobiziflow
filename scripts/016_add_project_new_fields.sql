-- Adicionar novos campos na tabela projects e ajustar tasks
-- Script: 016_add_project_new_fields.sql

-- 1. Adicionar novos campos na tabela projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS technical_responsible TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS key_user TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS estimated_hours INTEGER;

-- Adicionar comentários nas colunas
COMMENT ON COLUMN projects.technical_responsible IS 'Responsável técnico do projeto';
COMMENT ON COLUMN projects.key_user IS 'Key user do projeto';
COMMENT ON COLUMN projects.estimated_hours IS 'Horas estimadas do projeto';

-- 2. Ajustar a tabela tasks para os novos campos necessários
-- Primeiro, vamos atualizar os valores de status para corresponder ao formulário
UPDATE tasks 
SET status = CASE 
  WHEN status = 'todo' THEN 'not_started'
  WHEN status = 'in_progress' THEN 'in_progress'
  WHEN status = 'review' THEN 'in_progress'
  WHEN status = 'completed' THEN 'completed'
  ELSE 'not_started'
END;

-- Adicionar novos campos na tabela tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS responsible TEXT;

-- Renomear title para name para corresponder ao formulário
ALTER TABLE tasks 
RENAME COLUMN title TO name;

-- Ajustar a constraint de status para os novos valores
ALTER TABLE tasks 
DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold'));

-- Adicionar comentários nas colunas
COMMENT ON COLUMN tasks.start_date IS 'Data de início da tarefa';
COMMENT ON COLUMN tasks.end_date IS 'Data de fim da tarefa';
COMMENT ON COLUMN tasks.responsible IS 'Responsável pela tarefa';
COMMENT ON COLUMN tasks.name IS 'Nome da tarefa';

-- 3. Verificar se as colunas foram criadas
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name IN ('projects', 'tasks') 
AND column_name IN (
    'technical_responsible', 'key_user', 'estimated_hours',
    'start_date', 'end_date', 'responsible', 'name'
)
ORDER BY table_name, column_name;

-- 4. Mostrar estrutura atualizada das tabelas
SELECT 
    'projects' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

SELECT 
    'tasks' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position; 