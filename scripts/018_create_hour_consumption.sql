-- Script 018: Criar tabela hour_consumption para rastrear consumo de horas
-- Data: 2025-01-XX
-- Descrição: Sistema de rastreamento de consumo de horas por projeto e mês

-- Criar tabela hour_consumption
CREATE TABLE IF NOT EXISTS hour_consumption (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hour_package_id UUID NOT NULL REFERENCES hour_packages(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    consumed_hours INTEGER NOT NULL CHECK (consumed_hours > 0),
    consumption_date DATE NOT NULL DEFAULT CURRENT_DATE,
    month_year VARCHAR(7) NOT NULL, -- Formato: '2025-09', '2025-10'
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_hour_consumption_package_id ON hour_consumption(hour_package_id);
CREATE INDEX IF NOT EXISTS idx_hour_consumption_project_id ON hour_consumption(project_id);
CREATE INDEX IF NOT EXISTS idx_hour_consumption_month_year ON hour_consumption(month_year);
CREATE INDEX IF NOT EXISTS idx_hour_consumption_date ON hour_consumption(consumption_date);

-- Criar índice composto para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_hour_consumption_package_month ON hour_consumption(hour_package_id, month_year);

-- Adicionar comentários para documentação
COMMENT ON TABLE hour_consumption IS 'Rastreamento de consumo de horas por projeto e mês';
COMMENT ON COLUMN hour_consumption.hour_package_id IS 'Referência ao pacote de horas da empresa';
COMMENT ON COLUMN hour_consumption.project_id IS 'Projeto que consumiu as horas';
COMMENT ON COLUMN hour_consumption.consumed_hours IS 'Quantidade de horas consumidas';
COMMENT ON COLUMN hour_consumption.consumption_date IS 'Data do consumo';
COMMENT ON COLUMN hour_consumption.month_year IS 'Mês/ano do consumo (formato: YYYY-MM)';
COMMENT ON COLUMN hour_consumption.description IS 'Descrição opcional do consumo';

-- Habilitar RLS (Row Level Security)
ALTER TABLE hour_consumption ENABLE ROW LEVEL SECURITY;

-- Política RLS: Usuários podem ver apenas consumo de horas de empresas às quais pertencem
CREATE POLICY "Users can view hour consumption of their companies" ON hour_consumption
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            JOIN hour_packages hp ON hp.company_id = uc.company_id
            WHERE hp.id = hour_consumption.hour_package_id
            AND uc.user_id = auth.uid()
        )
    );

-- Política RLS: Apenas admins podem inserir/atualizar/deletar
CREATE POLICY "Only admins can manage hour consumption" ON hour_consumption
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_hour_consumption_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_hour_consumption_updated_at
    BEFORE UPDATE ON hour_consumption
    FOR EACH ROW
    EXECUTE FUNCTION update_hour_consumption_updated_at();

-- Função para gerar month_year automaticamente
CREATE OR REPLACE FUNCTION generate_month_year()
RETURNS TRIGGER AS $$
BEGIN
    NEW.month_year = TO_CHAR(NEW.consumption_date, 'YYYY-MM');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar month_year automaticamente
CREATE TRIGGER trigger_generate_month_year
    BEFORE INSERT OR UPDATE ON hour_consumption
    FOR EACH ROW
    EXECUTE FUNCTION generate_month_year();

-- Inserir dados de teste (opcional)
-- INSERT INTO hour_consumption (hour_package_id, project_id, consumed_hours, consumption_date, description, created_by)
-- VALUES 
--     ('uuid-do-pacote-1', 'uuid-do-projeto-1', 40, '2025-09-15', 'Desenvolvimento da API', 'uuid-do-usuario-admin'),
--     ('uuid-do-pacote-1', 'uuid-do-projeto-1', 30, '2025-09-20', 'Testes e homologação', 'uuid-do-usuario-admin'),
--     ('uuid-do-pacote-1', 'uuid-do-projeto-2', 25, '2025-09-25', 'Configuração do ambiente', 'uuid-do-usuario-admin');

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'hour_consumption'
ORDER BY ordinal_position; 