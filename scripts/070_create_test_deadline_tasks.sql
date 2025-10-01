-- Script para criar tarefas de teste com prazos próximos
-- Este script cria tarefas com datas que permitem testar os alertas de prazo

-- Inserir tarefas de teste no projeto FTD Marista
INSERT INTO tasks (
  id,
  project_id,
  name,
  description,
  start_date,
  end_date,
  responsible,
  status,
  priority,
  created_at,
  updated_at
) VALUES 
-- Tarefa que vence em 3 dias (deve gerar alerta de "breve")
(
  gen_random_uuid(),
  '88a0f262-899f-4eda-a50d-57ff8bda9595', -- ID do projeto FTD Marista
  'Tarefa Teste - 3 dias',
  'Tarefa que vence em 3 dias para testar alerta',
  CURRENT_DATE + INTERVAL '1 day', -- Início amanhã
  CURRENT_DATE + INTERVAL '3 days', -- Vence em 3 dias
  'Graziely Duete',
  'not_started',
  'medium',
  NOW(),
  NOW()
),
-- Tarefa que vence amanhã (deve gerar alerta urgente)
(
  gen_random_uuid(),
  '88a0f262-899f-4eda-a50d-57ff8bda9595',
  'Tarefa Teste - Amanhã',
  'Tarefa que vence amanhã para testar alerta urgente',
  CURRENT_DATE - INTERVAL '2 days', -- Iniciou há 2 dias
  CURRENT_DATE + INTERVAL '1 day', -- Vence amanhã
  'Graziely Duete',
  'in_progress',
  'high',
  NOW(),
  NOW()
),
-- Tarefa que já venceu (deve mudar status para atrasada)
(
  gen_random_uuid(),
  '88a0f262-899f-4eda-a50d-57ff8bda9595',
  'Tarefa Teste - Atrasada',
  'Tarefa que já venceu para testar status atrasada',
  CURRENT_DATE - INTERVAL '5 days', -- Iniciou há 5 dias
  CURRENT_DATE - INTERVAL '1 day', -- Venceu ontem
  'Graziely Duete',
  'in_progress',
  'high',
  NOW(),
  NOW()
);

-- Verificar as tarefas criadas
SELECT 
  name,
  start_date,
  end_date,
  responsible,
  status,
  CASE 
    WHEN end_date = CURRENT_DATE + INTERVAL '3 days' THEN 'Alerta em 3 dias'
    WHEN end_date = CURRENT_DATE + INTERVAL '1 day' THEN 'Alerta urgente (amanhã)'
    WHEN end_date < CURRENT_DATE THEN 'Atrasada'
    ELSE 'Normal'
  END as teste_tipo
FROM tasks 
WHERE project_id = '88a0f262-899f-4eda-a50d-57ff8bda9595'
  AND name LIKE 'Tarefa Teste%'
ORDER BY end_date;
