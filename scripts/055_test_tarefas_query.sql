-- Script para testar a consulta de tarefas_estimativa
-- Execute este script para verificar se as políticas RLS estão funcionando

-- Primeiro, vamos verificar se existem tarefas na tabela
SELECT 
  te.id,
  te.estimativa_id,
  te.funcionalidade,
  e.tipo as estimativa_tipo,
  e.created_by
FROM tarefas_estimativa te
JOIN estimativas e ON te.estimativa_id = e.id
LIMIT 5;

-- Verificar se existem estimativas públicas
SELECT 
  ep.token,
  ep.estimativa_id,
  e.tipo as estimativa_tipo,
  e.nome_projeto
FROM estimativas_publicas ep
JOIN estimativas e ON ep.estimativa_id = e.id
WHERE e.tipo = 'tarefa'
LIMIT 5;

-- Testar a consulta que está falhando (simulando como usuário anônimo)
-- Esta consulta deve funcionar se as políticas RLS estão corretas
SELECT 
  te.*
FROM tarefas_estimativa te
JOIN estimativas_publicas ep ON te.estimativa_id = ep.estimativa_id
WHERE ep.token = 'C8dOrTNIpyk6HSTAB6mapYPjTZd8dyn3'
ORDER BY te.id;
