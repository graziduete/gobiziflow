-- Script para renomear tecnologia "Stored Procedures" para "Procedures"
-- Data: 2025-12-09

UPDATE tecnologias 
SET nome = 'Procedures'
WHERE nome = 'Stored Procedures';

-- Verificar se a atualização foi bem-sucedida
SELECT id, nome, ativo 
FROM tecnologias 
WHERE nome = 'Procedures';

