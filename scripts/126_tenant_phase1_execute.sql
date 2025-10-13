-- FASE 1: IMPLEMENTAÇÃO COMPLETA - TABELAS DE CONFIGURAÇÃO
-- Execute TODO este script de uma vez

-- 1. Adicionar tenant_id em tabelas de configuração
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 2. Adicionar comentários
COMMENT ON COLUMN settings.tenant_id IS 'ID do tenant para isolamento multi-tenant';
COMMENT ON COLUMN notifications.tenant_id IS 'ID do tenant para isolamento multi-tenant';
COMMENT ON COLUMN notification_logs.tenant_id IS 'ID do tenant para isolamento multi-tenant';

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_settings_tenant_id ON settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant_id ON notification_logs(tenant_id);

-- 4. Verificação final
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('settings', 'notifications', 'notification_logs')
AND column_name = 'tenant_id'
ORDER BY table_name;
