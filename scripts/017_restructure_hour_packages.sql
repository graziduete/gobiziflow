-- Script 017: Criar tabela hour_packages para gerenciar pacotes de horas
-- Data: 2025-01-XX
-- Descrição: Sistema de pacotes de horas por empresa

-- Criar tabela hour_packages
CREATE TABLE IF NOT EXISTS hour_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('monthly', 'period')),
    contracted_hours INTEGER NOT NULL CHECK (contracted_hours > 0),
    start_date DATE NOT NULL,
    end_date DATE, -- NULL para pacotes mensais
    is_current BOOLEAN NOT NULL DEFAULT false,
    account_model VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (account_model IN ('standard', 'current_account')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_hour_packages_company_id ON hour_packages(company_id);
CREATE INDEX IF NOT EXISTS idx_hour_packages_current ON hour_packages(is_current);
CREATE INDEX IF NOT EXISTS idx_hour_packages_status ON hour_packages(status);
CREATE INDEX IF NOT EXISTS idx_hour_packages_dates ON hour_packages(start_date, end_date);

-- Criar índice composto para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_hour_packages_company_current ON hour_packages(company_id, is_current);

-- Adicionar comentários para documentação
COMMENT ON TABLE hour_packages IS 'Pacotes de horas contratados pelas empresas';
COMMENT ON COLUMN hour_packages.company_id IS 'Referência à empresa que contratou o pacote';
COMMENT ON COLUMN hour_packages.package_type IS 'Tipo de pacote: monthly (mensal) ou period (período)';
COMMENT ON COLUMN hour_packages.contracted_hours IS 'Quantidade de horas contratadas';
COMMENT ON COLUMN hour_packages.start_date IS 'Data de início do pacote';
COMMENT ON COLUMN hour_packages.end_date IS 'Data de fim do pacote (NULL para mensais)';
COMMENT ON COLUMN hour_packages.is_current IS 'Indica se é o pacote ativo da empresa';
COMMENT ON COLUMN hour_packages.account_model IS 'Modelo de conta: standard ou current_account';
COMMENT ON COLUMN hour_packages.status IS 'Status do pacote: active, expired, cancelled';

-- Habilitar RLS (Row Level Security)
ALTER TABLE hour_packages ENABLE ROW LEVEL SECURITY;

-- Política RLS: Usuários podem ver apenas pacotes de empresas às quais pertencem
CREATE POLICY "Users can view hour packages of their companies" ON hour_packages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = hour_packages.company_id
            AND uc.user_id = auth.uid()
        )
    );

-- Política RLS: Apenas admins podem inserir/atualizar/deletar
CREATE POLICY "Only admins can manage hour packages" ON hour_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_hour_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_hour_packages_updated_at
    BEFORE UPDATE ON hour_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_hour_packages_updated_at();

-- Função para garantir que apenas um pacote ativo por empresa
CREATE OR REPLACE FUNCTION ensure_single_active_package()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o novo registro será ativo, desativar outros pacotes da mesma empresa
    IF NEW.is_current = true THEN
        UPDATE hour_packages 
        SET is_current = false, status = 'expired'
        WHERE company_id = NEW.company_id 
        AND id != NEW.id 
        AND is_current = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para garantir apenas um pacote ativo por empresa
CREATE TRIGGER trigger_ensure_single_active_package
    BEFORE INSERT OR UPDATE ON hour_packages
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_package();

-- Inserir dados de teste (opcional)
-- INSERT INTO hour_packages (company_id, package_type, contracted_hours, start_date, end_date, is_current, account_model, notes)
-- VALUES 
--     ('uuid-da-empresa-1', 'monthly', 160, '2025-09-01', NULL, true, 'current_account', 'Pacote mensal inicial'),
--     ('uuid-da-empresa-2', 'period', 500, '2025-09-01', '2025-12-31', true, 'standard', 'Pacote trimestral');

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'hour_packages'
ORDER BY ordinal_position; 