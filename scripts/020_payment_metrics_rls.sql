-- Script para configurar RLS nas tabelas de métricas de pagamento
-- Executar após o script 019_create_payment_metrics.sql

-- Habilitar RLS nas tabelas
ALTER TABLE payment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_metric_details ENABLE ROW LEVEL SECURITY;

-- Políticas para payment_metrics
-- Permitir que usuários autenticados vejam métricas de empresas que têm acesso
CREATE POLICY "Users can view payment metrics of their companies" ON payment_metrics
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Permitir que usuários autenticados insiram métricas para empresas que têm acesso
CREATE POLICY "Users can insert payment metrics for their companies" ON payment_metrics
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Permitir que usuários autenticados atualizem métricas de empresas que têm acesso
CREATE POLICY "Users can update payment metrics of their companies" ON payment_metrics
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Permitir que usuários autenticados deletem métricas de empresas que têm acesso
CREATE POLICY "Users can delete payment metrics of their companies" ON payment_metrics
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Políticas para payment_metric_details
-- Permitir que usuários autenticados vejam detalhes de métricas de empresas que têm acesso
CREATE POLICY "Users can view payment metric details of their companies" ON payment_metric_details
    FOR SELECT USING (
        payment_metric_id IN (
            SELECT pm.id FROM payment_metrics pm
            JOIN user_companies uc ON pm.company_id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Permitir que usuários autenticados insiram detalhes para métricas de empresas que têm acesso
CREATE POLICY "Users can insert payment metric details for their companies" ON payment_metric_details
    FOR INSERT WITH CHECK (
        payment_metric_id IN (
            SELECT pm.id FROM payment_metrics pm
            JOIN user_companies uc ON pm.company_id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Permitir que usuários autenticados atualizem detalhes de métricas de empresas que têm acesso
CREATE POLICY "Users can update payment metric details of their companies" ON payment_metric_details
    FOR UPDATE USING (
        payment_metric_id IN (
            SELECT pm.id FROM payment_metrics pm
            JOIN user_companies uc ON pm.company_id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Permitir que usuários autenticados deletem detalhes de métricas de empresas que têm acesso
CREATE POLICY "Users can delete payment metric details of their companies" ON payment_metric_details
    FOR DELETE USING (
        payment_metric_id IN (
            SELECT pm.id FROM payment_metrics pm
            JOIN user_companies uc ON pm.company_id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- Política adicional para administradores (se necessário)
-- Descomente as linhas abaixo se você quiser que administradores tenham acesso total

-- CREATE POLICY "Admins can do everything with payment metrics" ON payment_metrics
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE id = auth.uid() AND role = 'admin'
--         )
--     );

-- CREATE POLICY "Admins can do everything with payment metric details" ON payment_metric_details
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE id = auth.uid() AND role = 'admin'
--         )
--     );

-- Comentários
COMMENT ON POLICY "Users can view payment metrics of their companies" ON payment_metrics IS 'Permite que usuários vejam métricas de empresas que têm acesso';
COMMENT ON POLICY "Users can insert payment metrics for their companies" ON payment_metrics IS 'Permite que usuários criem métricas para empresas que têm acesso';
COMMENT ON POLICY "Users can update payment metrics of their companies" ON payment_metrics IS 'Permite que usuários atualizem métricas de empresas que têm acesso';
COMMENT ON POLICY "Users can delete payment metrics of their companies" ON payment_metrics IS 'Permite que usuários deletem métricas de empresas que têm acesso';