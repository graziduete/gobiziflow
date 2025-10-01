-- Verificar notificações na tabela notifications
SELECT 
  id,
  user_id,
  title,
  message,
  type,
  read,
  created_at,
  project_id,
  task_id,
  responsavel_id
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar se existem notificações para o usuário Graziely
SELECT 
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.type,
  n.read,
  n.created_at,
  p.full_name,
  p.email
FROM notifications n
LEFT JOIN profiles p ON p.id = n.user_id
WHERE p.email = 'graziely@gobi.consulting'
ORDER BY n.created_at DESC 
LIMIT 5;
