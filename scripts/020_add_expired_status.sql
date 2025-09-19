-- Script para adicionar status 'expirado' e atualizar configurações expiradas

-- 1. Adicionar 'expirado' como opção válida no enum (se necessário)
-- Nota: Se o status for um enum, pode ser necessário alterar o tipo
-- ALTER TYPE status_type ADD VALUE 'expirado';

-- 2. Atualizar configurações expiradas para status 'expirado'
UPDATE sustentacao_empresa_config 
SET 
  status = 'expirado',
  updated_at = NOW()
WHERE 
  status = 'ativo' 
  AND data_fim < CURRENT_DATE;

-- 3. Verificar o resultado
SELECT 
  id,
  company_id,
  status,
  data_inicio,
  data_fim,
  created_at,
  updated_at
FROM sustentacao_empresa_config 
WHERE company_id = '443a6a0e-768f-48e4-a9ea-0cd972375a30'
ORDER BY created_at DESC;