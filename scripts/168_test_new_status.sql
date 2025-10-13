-- Script para testar o novo status "Concluído com Atraso"
-- Execute este script no Supabase para verificar se o novo status está funcionando

-- 1. Verificar se existem tarefas com o novo status
SELECT 
  id,
  name,
  status,
  start_date,
  end_date,
  responsible
FROM tasks 
WHERE status = 'completed_delayed'
ORDER BY created_at DESC;

-- 2. Verificar se existem tarefas com status "concluído com atraso" (formato antigo)
SELECT 
  id,
  name,
  status,
  start_date,
  end_date,
  responsible
FROM tasks 
WHERE status = 'concluído com atraso'
ORDER BY created_at DESC;

-- 3. Contar tarefas por status
SELECT 
  status,
  COUNT(*) as total
FROM tasks 
GROUP BY status
ORDER BY total DESC;

-- 4. Verificar se o novo status está sendo aceito (teste de inserção)
-- Descomente as linhas abaixo para testar:
/*
INSERT INTO tasks (
  id,
  name,
  status,
  start_date,
  end_date,
  responsible,
  project_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Tarefa Teste - Concluído com Atraso',
  'completed_delayed',
  '2025-01-01',
  '2025-01-15',
  'Teste',
  (SELECT id FROM projects LIMIT 1),
  NOW(),
  NOW()
);
*/
