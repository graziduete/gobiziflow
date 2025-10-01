-- Script para criar sistema de notificações
-- Executar no Supabase SQL Editor

-- 1. Tabela de notificações in-app
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'project_assigned', 'deadline_warning', 'deadline_urgent', 'task_overdue'
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID, -- Referência opcional para tarefas específicas
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 2. Tabela de logs de notificações por email
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id UUID REFERENCES responsaveis(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'project_assigned', 'deadline_warning', 'deadline_urgent', 'task_overdue'
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID, -- Referência opcional para tarefas específicas
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' -- 'sent', 'failed', 'pending'
);

-- 3. Tabela de configurações de notificação
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  deadline_warnings BOOLEAN DEFAULT true,
  deadline_days_before INTEGER DEFAULT 3, -- Quantos dias antes avisar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_notification_logs_responsavel_id ON notification_logs(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para notification_logs (apenas admins)
CREATE POLICY "Admins can view notification logs" ON notification_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'admin_operacional')
    )
  );

-- Políticas RLS para notification_settings
CREATE POLICY "Users can manage their own notification settings" ON notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE notifications IS 'Notificações in-app para usuários cadastrados';
COMMENT ON TABLE notification_logs IS 'Log de notificações por email enviadas';
COMMENT ON TABLE notification_settings IS 'Configurações de notificação por usuário';

COMMENT ON COLUMN notifications.type IS 'Tipo de notificação: project_assigned, deadline_warning, deadline_urgent, task_overdue';
COMMENT ON COLUMN notification_logs.type IS 'Tipo de notificação: project_assigned, deadline_warning, deadline_urgent, task_overdue';
COMMENT ON COLUMN notification_settings.deadline_days_before IS 'Quantos dias antes do vencimento enviar alerta';
