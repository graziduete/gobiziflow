-- Script complementar para garantir que todas as colunas necessárias sejam criadas
-- Script: 017_complete_project_fields.sql

-- 1. Verificar e adicionar campos que podem não ter sido criados na tabela projects
DO $$ 
BEGIN
    -- Adicionar technical_responsible se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'technical_responsible') THEN
        ALTER TABLE projects ADD COLUMN technical_responsible TEXT;
        RAISE NOTICE 'Coluna technical_responsible adicionada à tabela projects';
    ELSE
        RAISE NOTICE 'Coluna technical_responsible já existe na tabela projects';
    END IF;

    -- Adicionar key_user se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'key_user') THEN
        ALTER TABLE projects ADD COLUMN key_user TEXT;
        RAISE NOTICE 'Coluna key_user adicionada à tabela projects';
    ELSE
        RAISE NOTICE 'Coluna key_user já existe na tabela projects';
    END IF;

    -- Adicionar estimated_hours se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'estimated_hours') THEN
        ALTER TABLE projects ADD COLUMN estimated_hours INTEGER;
        RAISE NOTICE 'Coluna estimated_hours adicionada à tabela projects';
    ELSE
        RAISE NOTICE 'Coluna estimated_hours já existe na tabela projects';
    END IF;
END $$;

-- 2. Verificar e adicionar campos que podem não ter sido criados na tabela tasks
DO $$ 
BEGIN
    -- Adicionar start_date se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'start_date') THEN
        ALTER TABLE tasks ADD COLUMN start_date DATE;
        RAISE NOTICE 'Coluna start_date adicionada à tabela tasks';
    ELSE
        RAISE NOTICE 'Coluna start_date já existe na tabela tasks';
    END IF;

    -- Adicionar end_date se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'end_date') THEN
        ALTER TABLE tasks ADD COLUMN end_date DATE;
        RAISE NOTICE 'Coluna end_date adicionada à tabela tasks';
    ELSE
        RAISE NOTICE 'Coluna end_date já existe na tabela tasks';
    END IF;

    -- Adicionar responsible se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'responsible') THEN
        ALTER TABLE tasks ADD COLUMN responsible TEXT;
        RAISE NOTICE 'Coluna responsible adicionada à tabela tasks';
    ELSE
        RAISE NOTICE 'Coluna responsible já existe na tabela tasks';
    END IF;
END $$;

-- 3. Renomear title para name se ainda não foi feito
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'title') THEN
        ALTER TABLE tasks RENAME COLUMN title TO name;
        RAISE NOTICE 'Coluna title renomeada para name na tabela tasks';
    ELSE
        RAISE NOTICE 'Coluna name já existe na tabela tasks';
    END IF;
END $$;

-- 4. Atualizar constraint de status se necessário
DO $$ 
BEGIN
    -- Verificar se a constraint atual existe e quais valores aceita
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'tasks_status_check') THEN
        -- Dropar a constraint antiga
        ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
        RAISE NOTICE 'Constraint antiga de status removida';
    END IF;
    
    -- Adicionar nova constraint
    ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold'));
    RAISE NOTICE 'Nova constraint de status adicionada';
END $$;

-- 5. Atualizar valores de status existentes para corresponder aos novos valores
UPDATE tasks 
SET status = CASE 
    WHEN status = 'todo' THEN 'not_started'
    WHEN status = 'in_progress' THEN 'in_progress'
    WHEN status = 'review' THEN 'in_progress'
    WHEN status = 'completed' THEN 'completed'
    WHEN status NOT IN ('not_started', 'in_progress', 'completed', 'on_hold') THEN 'not_started'
    ELSE status
END;

-- 6. Verificar estrutura final das tabelas
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

-- 7. Verificar se as novas colunas foram criadas corretamente
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('projects', 'tasks') 
AND column_name IN (
    'technical_responsible', 'key_user', 'estimated_hours',
    'start_date', 'end_date', 'responsible', 'name'
)
ORDER BY table_name, column_name; 