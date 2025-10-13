-- FASE 3: IMPLEMENTAÇÃO CAUTELOSA - TABELAS CORE (MAIS CRÍTICAS)
-- Execute APENAS após confirmar que as Fases 1 e 2 funcionaram

-- === PASSO 3: TABELAS CORE DO SISTEMA ===

-- 3.1. Adicionar tenant_id em tabelas core
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE estimativas ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE responsaveis ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE hour_consumption ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE hour_packages ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- ALTER TABLE project_forecasts ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 3.2. Adicionar comentários
-- COMMENT ON COLUMN projects.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN companies.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN estimativas.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN tasks.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN responsaveis.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN hour_consumption.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN hour_packages.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN project_documents.tenant_id IS 'ID do tenant para isolamento multi-tenant';
-- COMMENT ON COLUMN project_forecasts.tenant_id IS 'ID do tenant para isolamento multi-tenant';

-- 3.3. Criar índices para performance
-- CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON companies(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_estimativas_tenant_id ON estimativas(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON tasks(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_responsaveis_tenant_id ON responsaveis(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_hour_consumption_tenant_id ON hour_consumption(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_hour_packages_tenant_id ON hour_packages(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_project_documents_tenant_id ON project_documents(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_project_forecasts_tenant_id ON project_forecasts(tenant_id);

-- === VERIFICAÇÃO ===
-- SELECT 
--     table_name,
--     column_name,
--     data_type,
--     is_nullable
-- FROM information_schema.columns 
-- WHERE table_name IN ('projects', 'companies', 'estimativas', 'tasks', 'responsaveis', 'hour_consumption', 'hour_packages', 'project_documents', 'project_forecasts')
-- AND column_name = 'tenant_id'
-- ORDER BY table_name;
