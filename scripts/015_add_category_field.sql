-- Adicionar campo category na tabela projects
-- Data: 2024-12-19

-- Adicionar coluna category na tabela projects
ALTER TABLE projects 
ADD COLUMN category VARCHAR(20) DEFAULT 'project' CHECK (category IN ('project', 'improvement'));

-- Comentário da coluna
COMMENT ON COLUMN projects.category IS 'Categoria do projeto: project (Projeto) ou improvement (Melhoria)';

-- Atualizar projetos existentes para 'project' (caso não tenham valor)
UPDATE projects 
SET category = 'project' 
WHERE category IS NULL;

-- Tornar a coluna NOT NULL após atualizar os valores existentes
ALTER TABLE projects 
ALTER COLUMN category SET NOT NULL;

-- Criar índice para melhor performance nas consultas
CREATE INDEX idx_projects_category ON projects(category);

-- Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'category';