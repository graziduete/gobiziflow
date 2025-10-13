-- Script para adicionar flags de client_admin na tabela profiles
-- Este script adiciona colunas para identificar e controlar client_admins

-- Adicionar coluna para identificar client_admins
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_client_admin BOOLEAN DEFAULT FALSE;

-- Adicionar coluna para controlar primeiro login
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_login_completed BOOLEAN DEFAULT TRUE;

-- Comentários nas colunas
COMMENT ON COLUMN profiles.is_client_admin IS 'Indica se o usuário é um administrador de empresa cliente';
COMMENT ON COLUMN profiles.first_login_completed IS 'Indica se o primeiro login foi completado (reset de senha obrigatório)';

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_profiles_is_client_admin ON profiles(is_client_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_first_login ON profiles(first_login_completed);

-- Atualizar registros existentes (assumindo que todos os existentes já completaram o primeiro login)
UPDATE profiles 
SET first_login_completed = TRUE 
WHERE first_login_completed IS NULL;
