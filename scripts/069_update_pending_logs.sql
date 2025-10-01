-- Script para atualizar logs de notificação que estão como "Pendente" mas o email foi enviado
-- Este script atualiza todos os logs de "project_assigned" que estão como "pending" para "sent"

UPDATE notification_logs 
SET status = 'sent' 
WHERE status = 'pending' 
  AND type = 'project_assigned'
  AND created_at >= NOW() - INTERVAL '1 hour'; -- Apenas logs da última hora

-- Verificar quantos logs foram atualizados
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM notification_logs 
WHERE type = 'project_assigned'
GROUP BY status
ORDER BY status;
