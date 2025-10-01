-- Script para estender sistema de notificações para responsáveis
-- Executar no Supabase SQL Editor

-- 1. Adicionar colunas na tabela notifications existente
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS task_id UUID,
ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES responsaveis(id) ON DELETE CASCADE;

-- 2. Atualizar constraint de tipo para incluir novos tipos
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('project_created','status_changed','project_assigned','deadline_warning','deadline_urgent','task_overdue'));

-- 3. Criar tabela de logs de notificações por email
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id UUID REFERENCES responsaveis(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('project_assigned','deadline_warning','deadline_urgent','task_overdue')),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID, -- Referência opcional para tarefas específicas
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_responsavel_id ON notifications(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notifications(task_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_responsavel_id ON notification_logs(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- 5. Habilitar RLS na tabela notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para notification_logs (apenas admins)
-- Remover política existente se houver
DROP POLICY IF EXISTS "Admins can view notification logs" ON notification_logs;

-- Criar nova política
CREATE POLICY "Admins can view notification logs" ON notification_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'admin_operacional')
    )
  );

-- 7. Comentários para documentação
COMMENT ON TABLE notification_logs IS 'Log de notificações por email enviadas para responsáveis';
COMMENT ON COLUMN notification_logs.type IS 'Tipo de notificação: project_assigned, deadline_warning, deadline_urgent, task_overdue';
COMMENT ON COLUMN notification_logs.status IS 'Status do envio: sent, failed, pending';
