-- Script para adicionar campo responsável na tabela projects
-- Executar no Supabase SQL Editor

-- Adicionar coluna responsavel_id na tabela projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES responsaveis(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_projects_responsavel_id ON projects(responsavel_id);

-- Comentário para documentação
COMMENT ON COLUMN projects.responsavel_id IS 'ID do responsável pelo projeto (referência à tabela responsaveis)';
