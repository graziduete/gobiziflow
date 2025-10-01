-- Limpar todas as notificações de teste das últimas 24 horas
-- Execute este script no Supabase SQL Editor para poder testar novamente

DELETE FROM notifications 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Verificar quantas notificações restaram
SELECT COUNT(*) as total_notifications FROM notifications;

-- Mostrar as notificações mais recentes
SELECT 
  id,
  type,
  title,
  message,
  created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;
