-- Script para corrigir RLS da tabela notification_logs
-- Executar no Supabase SQL Editor

-- 1. Desabilitar RLS temporariamente na tabela notification_logs
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se consegue inserir dados
INSERT INTO notification_logs (responsavel_id, email, type, subject, message, status) 
VALUES (
  'd4887ed1-a52e-4ae0-b427-46810f97fe4c',
  'teste@teste.com',
  'project_assigned',
  'Teste',
  'Mensagem de teste',
  'sent'
);

-- 3. Verificar se foi inserido
SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 5;

-- 4. Reabilitar RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 5. Remover política existente
DROP POLICY IF EXISTS "Admins can view notification logs" ON notification_logs;

-- 6. Criar nova política mais permissiva
CREATE POLICY "Admins can manage notification logs" ON notification_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'admin_operacional')
    )
  );

-- 7. Testar inserção com RLS habilitado
INSERT INTO notification_logs (responsavel_id, email, type, subject, message, status) 
VALUES (
  'd4887ed1-a52e-4ae0-b427-46810f97fe4c',
  'teste2@teste.com',
  'project_assigned',
  'Teste 2',
  'Mensagem de teste 2',
  'sent'
);

-- 8. Verificar se foi inserido com RLS
SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 5;
