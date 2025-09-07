-- Script para criar tabelas de métricas de pagamento
-- Executar após os scripts anteriores

-- Criar tabela payment_metrics
CREATE TABLE IF NOT EXISTS payment_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    hour_package_id UUID REFERENCES hour_packages(id) ON DELETE SET NULL, -- Opcional: métricas são independentes
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('monthly_fixed', 'percentage_phases', 'installments')),
    name VARCHAR(255) NOT NULL,
    total_value INTEGER NOT NULL DEFAULT 0, -- Valor em centavos
    hourly_rate INTEGER DEFAULT 0, -- Valor em centavos
    total_hours INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela payment_metric_details
CREATE TABLE IF NOT EXISTS payment_metric_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_metric_id UUID NOT NULL REFERENCES payment_metrics(id) ON DELETE CASCADE,
    detail_type VARCHAR(50) NOT NULL CHECK (detail_type IN ('monthly_amount', 'phase_percentage', 'installment_amount')),
    month_year VARCHAR(7), -- Formato: YYYY-MM (para parcelas mensais)
    phase_name VARCHAR(100), -- Nome da fase (planejamento, homologação, etc.)
    percentage INTEGER DEFAULT 0, -- Percentual (0-100)
    amount INTEGER DEFAULT 0, -- Valor em centavos
    installment_number INTEGER, -- Número da parcela
    is_paid BOOLEAN DEFAULT false,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_metrics_company_id ON payment_metrics(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_metrics_type ON payment_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_payment_metrics_active ON payment_metrics(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_metric_details_metric_id ON payment_metric_details(payment_metric_id);
CREATE INDEX IF NOT EXISTS idx_payment_metric_details_type ON payment_metric_details(detail_type);
CREATE INDEX IF NOT EXISTS idx_payment_metric_details_month ON payment_metric_details(month_year);

-- Função para calcular valor mensal
CREATE OR REPLACE FUNCTION calculate_monthly_amount(
    total_value INTEGER,
    start_date DATE,
    end_date DATE
) RETURNS INTEGER AS $$
DECLARE
    months_count INTEGER;
BEGIN
    months_count := (
        (EXTRACT(YEAR FROM end_date) - EXTRACT(YEAR FROM start_date)) * 12 +
        (EXTRACT(MONTH FROM end_date) - EXTRACT(MONTH FROM start_date)) + 1
    );
    
    IF months_count <= 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND(total_value::DECIMAL / months_count);
END;
$$ LANGUAGE plpgsql;

-- Função para gerar detalhes mensais automaticamente
CREATE OR REPLACE FUNCTION generate_monthly_details(
    metric_id UUID,
    total_value INTEGER,
    start_date DATE,
    end_date DATE
) RETURNS VOID AS $$
DECLARE
    current_date DATE;
    end_date_calc DATE;
    monthly_amount INTEGER;
    month_year_str VARCHAR(7);
BEGIN
    -- Limpar detalhes existentes
    DELETE FROM payment_metric_details WHERE payment_metric_id = metric_id;
    
    -- Calcular valor mensal
    monthly_amount := calculate_monthly_amount(total_value, start_date, end_date);
    
    -- Gerar registros mensais
    current_date := start_date;
    end_date_calc := end_date;
    
    WHILE current_date <= end_date_calc LOOP
        month_year_str := TO_CHAR(current_date, 'YYYY-MM');
        
        INSERT INTO payment_metric_details (
            payment_metric_id,
            detail_type,
            month_year,
            amount,
            due_date
        ) VALUES (
            metric_id,
            'monthly_amount',
            month_year_str,
            monthly_amount,
            current_date
        );
        
        -- Avançar para o próximo mês
        current_date := current_date + INTERVAL '1 month';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_payment_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_metrics_updated_at
    BEFORE UPDATE ON payment_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_metrics_updated_at();

CREATE TRIGGER trigger_update_payment_metric_details_updated_at
    BEFORE UPDATE ON payment_metric_details
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_metrics_updated_at();

-- Comentários nas tabelas
COMMENT ON TABLE payment_metrics IS 'Métricas de pagamento por empresa';
COMMENT ON TABLE payment_metric_details IS 'Detalhes específicos das métricas (parcelas, fases, etc.)';
COMMENT ON COLUMN payment_metrics.total_value IS 'Valor total em centavos';
COMMENT ON COLUMN payment_metrics.hourly_rate IS 'Valor da hora em centavos';
COMMENT ON COLUMN payment_metric_details.amount IS 'Valor em centavos';
COMMENT ON COLUMN payment_metric_details.percentage IS 'Percentual (0-100)';