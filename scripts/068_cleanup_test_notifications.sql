-- Script para limpar notificações de teste
-- Executar no Supabase SQL Editor

-- 1. Verificar quantas notificações de teste existem
SELECT 
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN email LIKE '%teste%' THEN 1 END) as test_notifications
FROM notification_logs;

-- 2. Verificar as notificações de teste antes de deletar
SELECT 
  id,
  email,
  subject,
  type,
  status,
  sent_at
FROM notification_logs 
WHERE email LIKE '%teste%'
ORDER BY sent_at DESC;

-- 3. Deletar notificações de teste
DELETE FROM notification_logs 
WHERE email LIKE '%teste%';

-- 4. Verificar se foram deletadas
SELECT 
  COUNT(*) as remaining_notifications
FROM notification_logs;

-- 5. (Opcional) Deletar também notificações in-app de teste se existirem
-- DELETE FROM notifications 
-- WHERE message LIKE '%Festejar%' 
-- AND created_at > '2025-09-30 19:00:00';

-- 6. Verificar notificações in-app restantes
SELECT 
  id,
  title,
  message,
  type,
  read,
  created_at
FROM notifications 
WHERE created_at > '2025-09-30 19:00:00'
ORDER BY created_at DESC;
