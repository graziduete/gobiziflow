-- Script para criar tabela de responsáveis
-- Executar no Supabase SQL Editor

-- Criar tabela responsaveis
CREATE TABLE IF NOT EXISTS responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  empresa VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_responsaveis_email ON responsaveis(email);
CREATE INDEX IF NOT EXISTS idx_responsaveis_ativo ON responsaveis(ativo);
CREATE INDEX IF NOT EXISTS idx_responsaveis_nome ON responsaveis(nome);

-- Habilitar RLS
ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;

-- Política RLS para permitir acesso a todos os admins
CREATE POLICY "Responsaveis são visíveis para todos os admins" ON responsaveis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'admin_operacional')
    )
  );

-- Comentários para documentação
COMMENT ON TABLE responsaveis IS 'Tabela para armazenar responsáveis por tarefas e projetos';
COMMENT ON COLUMN responsaveis.nome IS 'Nome completo do responsável';
COMMENT ON COLUMN responsaveis.email IS 'Email único do responsável (usado para notificações)';
COMMENT ON COLUMN responsaveis.empresa IS 'Empresa do responsável (opcional)';
COMMENT ON COLUMN responsaveis.ativo IS 'Status ativo/inativo do responsável';
