-- =====================================================
-- Script: 031_create_estimativas_schema.sql
-- Descrição: Criação do schema para módulo de Estimativas
-- Data: 2025-01-XX
-- =====================================================

-- =============================================================================
-- 1. TABELA PRINCIPAL DE ESTIMATIVAS
-- =============================================================================

CREATE TABLE IF NOT EXISTS estimativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_projeto VARCHAR(255) NOT NULL,
  meses_previstos INTEGER NOT NULL CHECK (meses_previstos > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'proposta_comercial' 
    CHECK (status IN ('proposta_comercial', 'em_aprovacao', 'aprovada', 'rejeitada', 'convertida_projeto')),
  percentual_imposto DECIMAL(5,2) NOT NULL DEFAULT 15.53,
  observacoes TEXT,
  total_estimado DECIMAL(12,2) DEFAULT 0,
  total_com_impostos DECIMAL(12,2) DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 2. TABELA DE RECURSOS POR ESTIMATIVA
-- =============================================================================

CREATE TABLE IF NOT EXISTS recursos_estimativa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimativa_id UUID NOT NULL REFERENCES estimativas(id) ON DELETE CASCADE,
  nome_recurso VARCHAR(100) NOT NULL,
  taxa_hora DECIMAL(8,2) NOT NULL CHECK (taxa_hora > 0),
  total_horas DECIMAL(8,2) DEFAULT 0,
  total_custo DECIMAL(12,2) DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. TABELA DE ALOCAÇÃO DE HORAS POR SEMANA
-- =============================================================================

CREATE TABLE IF NOT EXISTS alocacao_semanal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurso_id UUID NOT NULL REFERENCES recursos_estimativa(id) ON DELETE CASCADE,
  semana INTEGER NOT NULL CHECK (semana > 0),
  horas DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (horas >= 0),
  custo_semanal DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recurso_id, semana)
);

-- =============================================================================
-- 4. TABELA DE TEMPLATES DE RECURSOS (para facilitar criação)
-- =============================================================================

CREATE TABLE IF NOT EXISTS templates_recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  taxa_hora_padrao DECIMAL(8,2) NOT NULL DEFAULT 0,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir templates padrão
INSERT INTO templates_recursos (nome, taxa_hora_padrao, descricao) VALUES
('Gerente de Projeto', 150.00, 'Responsável pela gestão geral do projeto'),
('Desenvolvedor Full Stack', 120.00, 'Desenvolvimento frontend e backend'),
('Desenvolvedor Frontend', 100.00, 'Especialista em interfaces e experiência do usuário'),
('Desenvolvedor Backend', 110.00, 'Especialista em APIs e lógica de negócio'),
('QA/Tester', 80.00, 'Testes e garantia de qualidade'),
('Arquiteto de Software', 180.00, 'Arquitetura e design técnico'),
('Consultor Técnico', 200.00, 'Consultoria especializada'),
('Designer UX/UI', 90.00, 'Design de interface e experiência do usuário'),
('DevOps', 130.00, 'Infraestrutura e deploy'),
('Analista de Negócios', 95.00, 'Análise de requisitos e processos')
ON CONFLICT (nome) DO NOTHING;

-- =============================================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Índices para estimativas
CREATE INDEX IF NOT EXISTS idx_estimativas_created_by ON estimativas(created_by);
CREATE INDEX IF NOT EXISTS idx_estimativas_status ON estimativas(status);
CREATE INDEX IF NOT EXISTS idx_estimativas_created_at ON estimativas(created_at);

-- Índices para recursos
CREATE INDEX IF NOT EXISTS idx_recursos_estimativa_id ON recursos_estimativa(estimativa_id);
CREATE INDEX IF NOT EXISTS idx_recursos_ordem ON recursos_estimativa(estimativa_id, ordem);

-- Índices para alocação semanal
CREATE INDEX IF NOT EXISTS idx_alocacao_recurso_id ON alocacao_semanal(recurso_id);
CREATE INDEX IF NOT EXISTS idx_alocacao_semana ON alocacao_semanal(recurso_id, semana);

-- =============================================================================
-- 6. TRIGGERS PARA CÁLCULOS AUTOMÁTICOS
-- =============================================================================

-- Função para calcular totais da estimativa
CREATE OR REPLACE FUNCTION calcular_totais_estimativa()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar totais do recurso
  UPDATE recursos_estimativa 
  SET 
    total_horas = (
      SELECT COALESCE(SUM(horas), 0) 
      FROM alocacao_semanal 
      WHERE recurso_id = NEW.recurso_id
    ),
    total_custo = (
      SELECT COALESCE(SUM(custo_semanal), 0) 
      FROM alocacao_semanal 
      WHERE recurso_id = NEW.recurso_id
    ),
    updated_at = NOW()
  WHERE id = NEW.recurso_id;

  -- Atualizar totais da estimativa
  UPDATE estimativas 
  SET 
    total_estimado = (
      SELECT COALESCE(SUM(total_custo), 0) 
      FROM recursos_estimativa 
      WHERE estimativa_id = (
        SELECT estimativa_id 
        FROM recursos_estimativa 
        WHERE id = NEW.recurso_id
      )
    ),
    updated_at = NOW()
  WHERE id = (
    SELECT estimativa_id 
    FROM recursos_estimativa 
    WHERE id = NEW.recurso_id
  );

  -- Calcular total com impostos
  UPDATE estimativas 
  SET 
    total_com_impostos = total_estimado * (1 + percentual_imposto / 100),
    updated_at = NOW()
  WHERE id = (
    SELECT estimativa_id 
    FROM recursos_estimativa 
    WHERE id = NEW.recurso_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para alocação semanal
CREATE TRIGGER trigger_calcular_totais_alocacao
  AFTER INSERT OR UPDATE OR DELETE ON alocacao_semanal
  FOR EACH ROW
  EXECUTE FUNCTION calcular_totais_estimativa();

-- Função para calcular custo semanal automaticamente
CREATE OR REPLACE FUNCTION calcular_custo_semanal()
RETURNS TRIGGER AS $$
DECLARE
  taxa_hora_recurso DECIMAL(8,2);
BEGIN
  -- Buscar taxa horária do recurso
  SELECT recursos_estimativa.taxa_hora INTO taxa_hora_recurso
  FROM recursos_estimativa 
  WHERE recursos_estimativa.id = NEW.recurso_id;

  -- Calcular custo semanal
  NEW.custo_semanal = NEW.horas * taxa_hora_recurso;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para custo semanal
CREATE TRIGGER trigger_calcular_custo_semanal
  BEFORE INSERT OR UPDATE ON alocacao_semanal
  FOR EACH ROW
  EXECUTE FUNCTION calcular_custo_semanal();

-- =============================================================================
-- 7. RLS (ROW LEVEL SECURITY)
-- =============================================================================

-- Habilitar RLS
ALTER TABLE estimativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos_estimativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE alocacao_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_recursos ENABLE ROW LEVEL SECURITY;

-- Políticas para estimativas
CREATE POLICY "estimativas_select_admin" ON estimativas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

CREATE POLICY "estimativas_insert_admin" ON estimativas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

CREATE POLICY "estimativas_update_admin" ON estimativas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

CREATE POLICY "estimativas_delete_admin" ON estimativas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

-- Políticas para recursos_estimativa
CREATE POLICY "recursos_select_admin" ON recursos_estimativa
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

CREATE POLICY "recursos_insert_admin" ON recursos_estimativa
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

CREATE POLICY "recursos_update_admin" ON recursos_estimativa
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

CREATE POLICY "recursos_delete_admin" ON recursos_estimativa
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

-- Políticas para alocacao_semanal
CREATE POLICY "alocacao_select_admin" ON alocacao_semanal
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

CREATE POLICY "alocacao_insert_admin" ON alocacao_semanal
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

CREATE POLICY "alocacao_update_admin" ON alocacao_semanal
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

CREATE POLICY "alocacao_delete_admin" ON alocacao_semanal
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

-- Políticas para templates_recursos (todos podem ler, apenas admin pode modificar)
CREATE POLICY "templates_select_all" ON templates_recursos
  FOR SELECT USING (true);

CREATE POLICY "templates_insert_admin" ON templates_recursos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

CREATE POLICY "templates_update_admin" ON templates_recursos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

CREATE POLICY "templates_delete_admin" ON templates_recursos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
  );

-- =============================================================================
-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================================================

COMMENT ON TABLE estimativas IS 'Estimativas de projetos com cálculo automático de custos';
COMMENT ON COLUMN estimativas.nome_projeto IS 'Nome do projeto para estimativa';
COMMENT ON COLUMN estimativas.meses_previstos IS 'Quantidade de meses previstos para o projeto';
COMMENT ON COLUMN estimativas.status IS 'Status atual da estimativa';
COMMENT ON COLUMN estimativas.percentual_imposto IS 'Percentual de impostos aplicado (padrão 15.53%)';
COMMENT ON COLUMN estimativas.total_estimado IS 'Total estimado sem impostos (calculado automaticamente)';
COMMENT ON COLUMN estimativas.total_com_impostos IS 'Total final com impostos (calculado automaticamente)';

COMMENT ON TABLE recursos_estimativa IS 'Recursos alocados em cada estimativa';
COMMENT ON COLUMN recursos_estimativa.nome_recurso IS 'Nome do recurso (ex: Gerente, Desenvolvedor)';
COMMENT ON COLUMN recursos_estimativa.taxa_hora IS 'Taxa horária do recurso';
COMMENT ON COLUMN recursos_estimativa.total_horas IS 'Total de horas do recurso (calculado automaticamente)';
COMMENT ON COLUMN recursos_estimativa.total_custo IS 'Custo total do recurso (calculado automaticamente)';

COMMENT ON TABLE alocacao_semanal IS 'Alocação de horas por semana para cada recurso';
COMMENT ON COLUMN alocacao_semanal.semana IS 'Número da semana (1, 2, 3, etc.)';
COMMENT ON COLUMN alocacao_semanal.horas IS 'Quantidade de horas alocadas na semana';
COMMENT ON COLUMN alocacao_semanal.custo_semanal IS 'Custo da semana (calculado automaticamente)';

COMMENT ON TABLE templates_recursos IS 'Templates de recursos para facilitar criação de estimativas';
