-- Script para remover temporariamente a constraint UNIQUE do email
-- Executar no Supabase SQL Editor

-- Remover a constraint UNIQUE do email temporariamente
ALTER TABLE responsaveis DROP CONSTRAINT IF EXISTS responsaveis_email_key;

-- Comentário: Esta constraint será readicionada após os testes
-- Para readicionar: ALTER TABLE responsaveis ADD CONSTRAINT responsaveis_email_key UNIQUE (email);
