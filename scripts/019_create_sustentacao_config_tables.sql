-- Script para criar tabelas de configuração de sustentação
-- Mantém compatibilidade com V1 existente

-- 1. Tabela de configuração de empresas para sustentação
CREATE TABLE IF NOT EXISTS sustentacao_empresa_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    horas_contratadas DECIMAL(5,2) NOT NULL DEFAULT 0, -- Ex: 90.00 horas
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    saldo_negativo BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'expirado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Validações
    CONSTRAINT valid_horas CHECK (horas_contratadas > 0),
    CONSTRAINT valid_periodo CHECK (data_fim > data_inicio),
    CONSTRAINT unique_active_config UNIQUE (company_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- 2. Tabela de histórico mensal de saldos
CREATE TABLE IF NOT EXISTS sustentacao_saldo_mensal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES sustentacao_empresa_config(id) ON DELETE CASCADE,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    horas_contratadas DECIMAL(5,2) NOT NULL,
    horas_consumidas DECIMAL(5,2) DEFAULT 0,
    saldo_mes DECIMAL(5,2) NOT NULL, -- Pode ser negativo
    saldo_anterior DECIMAL(5,2) DEFAULT 0,
    saldo_acumulado DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'fechado', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validações
    CONSTRAINT unique_monthly_balance UNIQUE (company_id, ano, mes),
    CONSTRAINT valid_year CHECK (ano >= 2020 AND ano <= 2030)
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_sustentacao_config_company ON sustentacao_empresa_config(company_id);
CREATE INDEX IF NOT EXISTS idx_sustentacao_config_status ON sustentacao_empresa_config(status);
CREATE INDEX IF NOT EXISTS idx_sustentacao_config_periodo ON sustentacao_empresa_config(data_inicio, data_fim);

CREATE INDEX IF NOT EXISTS idx_sustentacao_saldo_company ON sustentacao_saldo_mensal(company_id);
CREATE INDEX IF NOT EXISTS idx_sustentacao_saldo_periodo ON sustentacao_saldo_mensal(ano, mes);
CREATE INDEX IF NOT EXISTS idx_sustentacao_saldo_config ON sustentacao_saldo_mensal(config_id);

-- 4. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sustentacao_config_updated_at 
    BEFORE UPDATE ON sustentacao_empresa_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sustentacao_saldo_updated_at 
    BEFORE UPDATE ON sustentacao_saldo_mensal 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Função para obter configuração ativa de uma empresa
CREATE OR REPLACE FUNCTION get_sustentacao_config_ativa(company_uuid UUID)
RETURNS TABLE (
    id UUID,
    company_id UUID,
    horas_contratadas DECIMAL(5,2),
    data_inicio DATE,
    data_fim DATE,
    saldo_negativo BOOLEAN,
    status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sec.id,
        sec.company_id,
        sec.horas_contratadas,
        sec.data_inicio,
        sec.data_fim,
        sec.saldo_negativo,
        sec.status
    FROM sustentacao_empresa_config sec
    WHERE sec.company_id = company_uuid
    AND sec.status = 'ativo'
    AND CURRENT_DATE BETWEEN sec.data_inicio AND sec.data_fim
    ORDER BY sec.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para obter saldo mensal
CREATE OR REPLACE FUNCTION get_sustentacao_saldo_mensal(
    company_uuid UUID,
    ano_param INTEGER,
    mes_param INTEGER
)
RETURNS TABLE (
    id UUID,
    company_id UUID,
    ano INTEGER,
    mes INTEGER,
    horas_contratadas DECIMAL(5,2),
    horas_consumidas DECIMAL(5,2),
    saldo_mes DECIMAL(5,2),
    saldo_anterior DECIMAL(5,2),
    saldo_acumulado DECIMAL(5,2),
    status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ssm.id,
        ssm.company_id,
        ssm.ano,
        ssm.mes,
        ssm.horas_contratadas,
        ssm.horas_consumidas,
        ssm.saldo_mes,
        ssm.saldo_anterior,
        ssm.saldo_acumulado,
        ssm.status
    FROM sustentacao_saldo_mensal ssm
    WHERE ssm.company_id = company_uuid
    AND ssm.ano = ano_param
    AND ssm.mes = mes_param
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 7. RLS (Row Level Security) - Desabilitado por enquanto para facilitar desenvolvimento
-- ALTER TABLE sustentacao_empresa_config ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sustentacao_saldo_mensal ENABLE ROW LEVEL SECURITY;

-- 8. Comentários para documentação
COMMENT ON TABLE sustentacao_empresa_config IS 'Configurações de sustentação por empresa com períodos de vigência';
COMMENT ON TABLE sustentacao_saldo_mensal IS 'Histórico mensal de saldos de sustentação por empresa';

COMMENT ON COLUMN sustentacao_empresa_config.horas_contratadas IS 'Horas contratadas no período (ex: 90.00)';
COMMENT ON COLUMN sustentacao_empresa_config.data_inicio IS 'Data de início do contrato de sustentação';
COMMENT ON COLUMN sustentacao_empresa_config.data_fim IS 'Data de fim do contrato de sustentação';
COMMENT ON COLUMN sustentacao_empresa_config.saldo_negativo IS 'Se permite saldo negativo para próximo mês';

COMMENT ON COLUMN sustentacao_saldo_mensal.saldo_mes IS 'Saldo do mês (pode ser negativo se permitido)';
COMMENT ON COLUMN sustentacao_saldo_mensal.saldo_anterior IS 'Saldo do mês anterior';
COMMENT ON COLUMN sustentacao_saldo_mensal.saldo_acumulado IS 'Saldo acumulado até o mês';

-- 9. Dados de exemplo (opcional - remover em produção)
-- INSERT INTO sustentacao_empresa_config (company_id, horas_contratadas, data_inicio, data_fim, saldo_negativo, created_by)
-- SELECT 
--     c.id,
--     40.00,
--     '2025-01-01',
--     '2025-12-31',
--     true,
--     (SELECT id FROM auth.users LIMIT 1)
-- FROM companies c
-- WHERE c.name ILIKE '%copersucar%'
-- LIMIT 1;

-- ✅ Tabelas de configuração de sustentação criadas com sucesso!
-- 📊 Tabelas criadas:
--    - sustentacao_empresa_config (configurações por empresa)
--    - sustentacao_saldo_mensal (histórico mensal)
-- 🔧 Funções criadas:
--    - get_sustentacao_config_ativa(company_id)
--    - get_sustentacao_saldo_mensal(company_id, ano, mes)