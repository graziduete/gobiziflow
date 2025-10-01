-- Verificar notificações duplicadas
SELECT 
  responsavel_id,
  type,
  title,
  message,
  project_id,
  task_id,
  created_at,
  COUNT(*) as count
FROM notifications 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY responsavel_id, type, title, message, project_id, task_id, created_at
HAVING COUNT(*) > 1
ORDER BY created_at DESC;

-- Verificar todas as notificações recentes
SELECT 
  id,
  responsavel_id,
  type,
  title,
  message,
  project_id,
  task_id,
  created_at
FROM notifications 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
