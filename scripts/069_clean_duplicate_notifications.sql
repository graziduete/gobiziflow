-- Limpar notificações duplicadas
-- Manter apenas a notificação mais recente de cada tipo para cada responsável

WITH ranked_notifications AS (
  SELECT 
    id,
    responsavel_id,
    type,
    title,
    message,
    project_id,
    task_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY responsavel_id, type, title, project_id, task_id 
      ORDER BY created_at DESC
    ) as rn
  FROM notifications
  WHERE created_at >= NOW() - INTERVAL '24 hours'
)
DELETE FROM notifications 
WHERE id IN (
  SELECT id 
  FROM ranked_notifications 
  WHERE rn > 1
);

-- Verificar quantas notificações restaram
SELECT 
  type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM notifications 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY type
ORDER BY latest DESC;
