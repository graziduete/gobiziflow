-- Script para adicionar a coluna project_type na tabela projects
-- Data: 2025-01-XX

-- Adicionar a coluna project_type na tabela projects
ALTER TABLE projects 
ADD COLUMN project_type TEXT;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN projects.project_type IS 'Tipo do projeto (automation, data_analytics, digital_development, design, consulting, project_management, system_integration, infrastructure, support, training)';

-- Criar um índice para melhorar performance de consultas por tipo
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'project_type'; 