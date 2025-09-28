-- Script para corrigir RLS da tabela tarefas_estimativa
-- Permitir acesso público para visualização de estimativas

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tarefas_estimativa';

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "tarefas_estimativa_select_policy" ON tarefas_estimativa;
DROP POLICY IF EXISTS "tarefas_estimativa_insert_policy" ON tarefas_estimativa;
DROP POLICY IF EXISTS "tarefas_estimativa_update_policy" ON tarefas_estimativa;
DROP POLICY IF EXISTS "tarefas_estimativa_delete_policy" ON tarefas_estimativa;

-- Criar política permissiva para SELECT (acesso público)
CREATE POLICY "tarefas_estimativa_select_policy" ON tarefas_estimativa
    FOR SELECT
    USING (true);

-- Criar política para INSERT (apenas usuários autenticados)
CREATE POLICY "tarefas_estimativa_insert_policy" ON tarefas_estimativa
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Criar política para UPDATE (apenas usuários autenticados)
CREATE POLICY "tarefas_estimativa_update_policy" ON tarefas_estimativa
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Criar política para DELETE (apenas usuários autenticados)
CREATE POLICY "tarefas_estimativa_delete_policy" ON tarefas_estimativa
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tarefas_estimativa';

-- Habilitar RLS se não estiver
ALTER TABLE tarefas_estimativa ENABLE ROW LEVEL SECURITY;

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tarefas_estimativa';
