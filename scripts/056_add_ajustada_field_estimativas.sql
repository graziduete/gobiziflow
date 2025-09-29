-- Adicionar campo para rastrear se estimativa foi ajustada pelo admin normal
ALTER TABLE estimativas 
ADD COLUMN IF NOT EXISTS ajustada_por_admin BOOLEAN DEFAULT FALSE;

-- Comentário explicativo
COMMENT ON COLUMN estimativas.ajustada_por_admin IS 'Indica se a estimativa foi ajustada por um admin normal após ser criada por admin_operacional';
