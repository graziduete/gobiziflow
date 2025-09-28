-- Script para criar tabela de estimativas públicas (compartilhamento por link)
-- Este script cria a estrutura para permitir compartilhamento de estimativas via link público

-- Criar tabela para links públicos de estimativas
CREATE TABLE IF NOT EXISTS estimativas_publicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimativa_id UUID NOT NULL REFERENCES estimativas(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_estimativas_publicas_token ON estimativas_publicas(token);

-- Criar índice para busca por estimativa_id
CREATE INDEX IF NOT EXISTS idx_estimativas_publicas_estimativa_id ON estimativas_publicas(estimativa_id);

-- Habilitar RLS
ALTER TABLE estimativas_publicas ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam seus próprios links
CREATE POLICY "Users can view their own public links" ON estimativas_publicas
  FOR SELECT USING (auth.uid() = created_by);

-- Política para permitir que usuários autenticados criem links para suas estimativas
CREATE POLICY "Users can create public links for their estimates" ON estimativas_publicas
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM estimativas 
      WHERE id = estimativa_id AND created_by = auth.uid()
    )
  );

-- Política para permitir que usuários autenticados atualizem seus próprios links
CREATE POLICY "Users can update their own public links" ON estimativas_publicas
  FOR UPDATE USING (auth.uid() = created_by);

-- Política para permitir que usuários autenticados excluam seus próprios links
CREATE POLICY "Users can delete their own public links" ON estimativas_publicas
  FOR DELETE USING (auth.uid() = created_by);

-- Função para gerar token único
CREATE OR REPLACE FUNCTION generate_public_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Gerar token aleatório de 32 caracteres
    token := encode(gen_random_bytes(24), 'base64url');
    
    -- Verificar se token já existe
    SELECT COUNT(*) INTO exists_count 
    FROM estimativas_publicas 
    WHERE estimativas_publicas.token = token;
    
    -- Se não existe, usar este token
    IF exists_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar acesso ao link público
CREATE OR REPLACE FUNCTION register_public_access(token_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE estimativas_publicas 
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE estimativas_publicas.token = token_param;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE estimativas_publicas IS 'Tabela para armazenar links públicos de estimativas';
COMMENT ON COLUMN estimativas_publicas.token IS 'Token único para acesso público (usado na URL)';
COMMENT ON COLUMN estimativas_publicas.expires_at IS 'Data de expiração do link (NULL = não expira)';
COMMENT ON COLUMN estimativas_publicas.access_count IS 'Contador de acessos ao link';
COMMENT ON COLUMN estimativas_publicas.last_accessed_at IS 'Última vez que o link foi acessado';
