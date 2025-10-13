-- Script 156: Adicionar tenant_id na tabela responsaveis para isolamento multi-tenant

-- 1. Adicionar coluna tenant_id
ALTER TABLE responsaveis 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES client_companies(id);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_responsaveis_tenant_id ON responsaveis(tenant_id);

-- 3. Adicionar comentário
COMMENT ON COLUMN responsaveis.tenant_id IS 'ID da empresa cliente (tenant) - NULL para admin principal, preenchido para Client Admin';

-- 4. Atualizar registros existentes para NULL (Admin Master/Normal)
UPDATE responsaveis 
SET tenant_id = NULL 
WHERE tenant_id IS NULL;

-- 5. Verificar estrutura atualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'responsaveis' 
ORDER BY ordinal_position;

-- 6. Mostrar estatísticas
SELECT 
    COUNT(*) as total_responsaveis,
    COUNT(tenant_id) as com_tenant_id,
    COUNT(*) - COUNT(tenant_id) as sem_tenant_id
FROM responsaveis;

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Coluna tenant_id adicionada na tabela responsaveis com sucesso!';
    RAISE NOTICE '✅ Índice idx_responsaveis_tenant_id criado!';
    RAISE NOTICE '✅ Registros existentes atualizados para tenant_id NULL!';
END $$;
