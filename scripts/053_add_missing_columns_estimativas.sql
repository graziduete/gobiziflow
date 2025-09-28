-- Script para adicionar colunas faltantes na tabela estimativas
-- para suportar estimativas por tarefa

-- Adicionar coluna percentual_gordura
ALTER TABLE estimativas 
ADD COLUMN IF NOT EXISTS percentual_gordura DECIMAL(5,2) DEFAULT 0;

-- Adicionar coluna valor_hora
ALTER TABLE estimativas 
ADD COLUMN IF NOT EXISTS valor_hora DECIMAL(10,2) DEFAULT 0;

-- Adicionar coluna tipo
ALTER TABLE estimativas 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'recurso';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'estimativas' 
AND column_name IN ('percentual_gordura', 'valor_hora', 'tipo')
ORDER BY column_name;
