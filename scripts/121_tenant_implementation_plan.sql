-- PLANO DE IMPLEMENTAÇÃO TENANT_ID - EXECUTAR EM ORDEM
-- Este script contém o plano completo, mas deve ser executado passo a passo

/*
=== FASE 1: PREPARAÇÃO ===
1. Analisar tabelas existentes (script 120)
2. Identificar tabelas críticas
3. Backup dos dados importantes

=== FASE 2: IMPLEMENTAÇÃO GRADUAL ===
4. Adicionar tenant_id em tabelas não-críticas primeiro
5. Testar com dados de desenvolvimento
6. Adicionar tenant_id em tabelas críticas
7. Migrar dados existentes

=== FASE 3: RLS E ISOLAMENTO ===
8. Implementar RLS com tenant_id
9. Testar isolamento
10. Ajustar políticas conforme necessário

=== FASE 4: PRODUÇÃO ===
11. Deploy em produção
12. Monitorar performance
13. Ajustar conforme necessário
*/

-- EXEMPLO: Adicionar tenant_id em uma tabela (NÃO EXECUTAR AINDA)
-- ALTER TABLE projects ADD COLUMN tenant_id UUID;
-- CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);

-- EXEMPLO: RLS Policy (NÃO EXECUTAR AINDA)
-- CREATE POLICY "tenant_isolation" ON projects
-- FOR ALL TO authenticated
-- USING (
--   -- Admin principal: vê tudo (tenant_id IS NULL)
--   tenant_id IS NULL 
--   OR 
--   -- Client admin: vê apenas seu tenant
--   (tenant_id = (SELECT company_id FROM profiles WHERE id = auth.uid() AND is_client_admin = true))
-- );
