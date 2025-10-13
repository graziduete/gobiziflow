-- FASE 1: IMPLEMENTAÇÃO CAUTELOSA - TABELAS MENOS CRÍTICAS
-- Execute este script passo a passo, descomentando uma linha por vez

-- === PASSO 1: TABELAS DE CONFIGURAÇÃO (MAIS SEGURAS) ===

-- 1.1. Adicionar tenant_id em settings (se existir)
-- ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- COMMENT ON COLUMN settings.tenant_id IS 'ID do tenant para isolamento multi-tenant';

-- 1.2. Adicionar tenant_id em notifications
-- ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- COMMENT ON COLUMN notifications.tenant_id IS 'ID do tenant para isolamento multi-tenant';

-- 1.3. Adicionar tenant_id em notification_logs
-- ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- COMMENT ON COLUMN notification_logs.tenant_id IS 'ID do tenant para isolamento multi-tenant';

-- === VERIFICAÇÃO ===
-- Execute este SELECT para verificar se as colunas foram adicionadas:
-- SELECT 
--     table_name,
--     column_name,
--     data_type,
--     is_nullable
-- FROM information_schema.columns 
-- WHERE table_name IN ('settings', 'notifications', 'notification_logs')
-- AND column_name = 'tenant_id'
-- ORDER BY table_name;
