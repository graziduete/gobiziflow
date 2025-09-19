-- Script para corrigir a constraint única de configurações ativas
-- A constraint atual impede ter múltiplas configurações inativas para a mesma empresa

-- 1. Remover a constraint atual
ALTER TABLE sustentacao_empresa_config DROP CONSTRAINT IF EXISTS unique_active_config;

-- 2. Criar uma constraint parcial que se aplica apenas a configurações ativas
-- Isso permite múltiplas configurações inativas/expiradas, mas apenas uma ativa por empresa
CREATE UNIQUE INDEX unique_active_config_per_company 
ON sustentacao_empresa_config (company_id) 
WHERE status = 'ativo';

-- 3. Verificar se a constraint foi criada corretamente
-- SELECT conname, contype, confrelid::regclass, confkey, confupdtype, confdeltype, confmatchtype
-- FROM pg_constraint 
-- WHERE conrelid = 'sustentacao_empresa_config'::regclass;

-- ✅ Constraint corrigida!
-- 📊 Agora é possível ter:
--    - Apenas 1 configuração ATIVA por empresa
--    - Múltiplas configurações INATIVAS por empresa  
--    - Múltiplas configurações EXPIRADAS por empresa