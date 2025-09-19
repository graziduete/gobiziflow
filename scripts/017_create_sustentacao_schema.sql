-- =====================================================
-- Script: 017_create_sustentacao_schema.sql
-- Descrição: Criação do schema para módulo de Sustentação
-- Data: 2025-09-11
-- =====================================================

-- Tabela para configuração de sustentação por empresa
CREATE TABLE IF NOT EXISTS sustentacao_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('ellevo', 'planilha', 'outro')),
  config JSONB NOT NULL DEFAULT '{}',
  horas_contratadas INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para garantir uma configuração por empresa
  UNIQUE(company_id)
);

-- Tabela para histórico de sincronizações
CREATE TABLE IF NOT EXISTS sustentacao_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sustentacao_config_id UUID NOT NULL REFERENCES sustentacao_config(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('ellevo', 'planilha', 'manual')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  chamados_sincronizados INTEGER DEFAULT 0,
  horas_sincronizadas DECIMAL(10,2) DEFAULT 0,
  error_message TEXT,
  sync_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela para cache de chamados (para performance)
CREATE TABLE IF NOT EXISTS sustentacao_chamados_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sustentacao_config_id UUID NOT NULL REFERENCES sustentacao_config(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL, -- ID do chamado no sistema externo (Ellevo, etc.)
  titulo TEXT NOT NULL,
  categoria VARCHAR(100),
  status VARCHAR(100),
  solicitante VARCHAR(255),
  responsavel VARCHAR(255),
  data_abertura TIMESTAMP WITH TIME ZONE,
  data_resolucao TIMESTAMP WITH TIME ZONE,
  tempo_atendimento INTEGER, -- em minutos
  horas_consumidas DECIMAL(10,2) DEFAULT 0,
  automacao VARCHAR(255),
  descricao TEXT,
  metadata JSONB DEFAULT '{}',
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(sustentacao_config_id, external_id)
);

-- Tabela para métricas calculadas (para performance)
CREATE TABLE IF NOT EXISTS sustentacao_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sustentacao_config_id UUID NOT NULL REFERENCES sustentacao_config(id) ON DELETE CASCADE,
  periodo DATE NOT NULL, -- YYYY-MM-01 (primeiro dia do mês)
  horas_contratadas INTEGER NOT NULL,
  horas_consumidas DECIMAL(10,2) DEFAULT 0,
  horas_restantes DECIMAL(10,2) DEFAULT 0,
  saldo_proximo_mes DECIMAL(10,2) DEFAULT 0,
  chamados_ativos INTEGER DEFAULT 0,
  chamados_por_categoria JSONB DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para uma métrica por período
  UNIQUE(sustentacao_config_id, periodo)
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_sustentacao_config_updated_at 
    BEFORE UPDATE ON sustentacao_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sync_history_date ON sustentacao_sync_history (started_at);
CREATE INDEX IF NOT EXISTS idx_sync_history_config ON sustentacao_sync_history (sustentacao_config_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_status ON sustentacao_sync_history (status);

CREATE INDEX IF NOT EXISTS idx_chamados_cache_config ON sustentacao_chamados_cache (sustentacao_config_id);
CREATE INDEX IF NOT EXISTS idx_chamados_cache_status ON sustentacao_chamados_cache (status);
CREATE INDEX IF NOT EXISTS idx_chamados_cache_categoria ON sustentacao_chamados_cache (categoria);
CREATE INDEX IF NOT EXISTS idx_chamados_cache_data ON sustentacao_chamados_cache (data_abertura);
CREATE INDEX IF NOT EXISTS idx_chamados_cache_cached ON sustentacao_chamados_cache (cached_at);

CREATE INDEX IF NOT EXISTS idx_metrics_periodo ON sustentacao_metrics (periodo);
CREATE INDEX IF NOT EXISTS idx_metrics_config ON sustentacao_metrics (sustentacao_config_id);

-- Função para calcular métricas automaticamente
CREATE OR REPLACE FUNCTION calculate_sustentacao_metrics(
    p_config_id UUID,
    p_periodo DATE
) RETURNS VOID AS $$
DECLARE
    v_horas_contratadas INTEGER;
    v_horas_consumidas DECIMAL(10,2);
    v_chamados_ativos INTEGER;
    v_chamados_por_categoria JSONB;
BEGIN
    -- Buscar horas contratadas da configuração
    SELECT horas_contratadas INTO v_horas_contratadas
    FROM sustentacao_config 
    WHERE id = p_config_id;
    
    -- Calcular horas consumidas do cache
    SELECT COALESCE(SUM(horas_consumidas), 0) INTO v_horas_consumidas
    FROM sustentacao_chamados_cache 
    WHERE sustentacao_config_id = p_config_id
    AND DATE_TRUNC('month', data_abertura) = DATE_TRUNC('month', p_periodo);
    
    -- Contar chamados ativos
    SELECT COUNT(*) INTO v_chamados_ativos
    FROM sustentacao_chamados_cache 
    WHERE sustentacao_config_id = p_config_id
    AND status NOT IN ('Concluído', 'Cancelado', 'Fechado');
    
    -- Agrupar por categoria
    SELECT jsonb_object_agg(categoria, quantidade) INTO v_chamados_por_categoria
    FROM (
        SELECT categoria, COUNT(*) as quantidade
        FROM sustentacao_chamados_cache 
        WHERE sustentacao_config_id = p_config_id
        AND DATE_TRUNC('month', data_abertura) = DATE_TRUNC('month', p_periodo)
        GROUP BY categoria
    ) sub;
    
    -- Inserir ou atualizar métricas
    INSERT INTO sustentacao_metrics (
        sustentacao_config_id,
        periodo,
        horas_contratadas,
        horas_consumidas,
        horas_restantes,
        saldo_proximo_mes,
        chamados_ativos,
        chamados_por_categoria
    ) VALUES (
        p_config_id,
        p_periodo,
        v_horas_contratadas,
        v_horas_consumidas,
        v_horas_contratadas - v_horas_consumidas,
        v_horas_contratadas - v_horas_consumidas, -- Por enquanto igual às restantes
        v_chamados_ativos,
        COALESCE(v_chamados_por_categoria, '{}'::jsonb)
    )
    ON CONFLICT (sustentacao_config_id, periodo) 
    DO UPDATE SET
        horas_consumidas = EXCLUDED.horas_consumidas,
        horas_restantes = EXCLUDED.horas_restantes,
        saldo_proximo_mes = EXCLUDED.saldo_proximo_mes,
        chamados_ativos = EXCLUDED.chamados_ativos,
        chamados_por_categoria = EXCLUDED.chamados_por_categoria,
        calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para limpar cache antigo (manter apenas últimos 3 meses)
CREATE OR REPLACE FUNCTION cleanup_old_sustentacao_cache()
RETURNS VOID AS $$
BEGIN
    DELETE FROM sustentacao_chamados_cache 
    WHERE cached_at < NOW() - INTERVAL '3 months';
    
    DELETE FROM sustentacao_metrics 
    WHERE periodo < DATE_TRUNC('month', NOW() - INTERVAL '3 months');
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE sustentacao_config IS 'Configurações de sustentação por empresa';
COMMENT ON TABLE sustentacao_sync_history IS 'Histórico de sincronizações com sistemas externos';
COMMENT ON TABLE sustentacao_chamados_cache IS 'Cache de chamados para performance';
COMMENT ON TABLE sustentacao_metrics IS 'Métricas calculadas por período';

-- Comentários nas colunas principais
COMMENT ON COLUMN sustentacao_config.provider_type IS 'Tipo de provedor: ellevo, planilha, outro';
COMMENT ON COLUMN sustentacao_config.config IS 'Configurações específicas do provedor (JSON)';
COMMENT ON COLUMN sustentacao_config.horas_contratadas IS 'Total de horas contratadas para sustentação';

COMMENT ON COLUMN sustentacao_sync_history.sync_type IS 'Tipo de sincronização realizada';
COMMENT ON COLUMN sustentacao_sync_history.status IS 'Status da sincronização: success, error, partial';
COMMENT ON COLUMN sustentacao_sync_history.chamados_sincronizados IS 'Quantidade de chamados sincronizados';

COMMENT ON COLUMN sustentacao_chamados_cache.external_id IS 'ID do chamado no sistema externo';
COMMENT ON COLUMN sustentacao_chamados_cache.horas_consumidas IS 'Horas consumidas neste chamado';
COMMENT ON COLUMN sustentacao_chamados_cache.metadata IS 'Dados adicionais do chamado (JSON)';

COMMENT ON COLUMN sustentacao_metrics.periodo IS 'Período das métricas (primeiro dia do mês)';
COMMENT ON COLUMN sustentacao_metrics.chamados_por_categoria IS 'Contagem de chamados por categoria (JSON)';

-- Dados de exemplo para teste (opcional - descomente se necessário)
/*
-- Inserir configuração de exemplo para Copersucar
INSERT INTO sustentacao_config (company_id, provider_type, config, horas_contratadas) 
VALUES (
    (SELECT id FROM companies WHERE name = 'Copersucar' LIMIT 1),
    'ellevo',
    '{"subdomain": "copersucar", "token": "mock-token", "cliente_ellevo": "COP001"}',
    40
) ON CONFLICT (company_id) DO NOTHING;
*/

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'sustentacao_%'
ORDER BY table_name;
