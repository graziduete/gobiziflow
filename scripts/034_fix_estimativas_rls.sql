-- =============================================================================
-- Script: Corrigir RLS para Estimativas
-- Descrição: Verificar e corrigir políticas RLS para permitir acesso às estimativas
-- Data: $(date)
-- =============================================================================

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'estimativas';

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'estimativas';

-- Temporariamente desabilitar RLS para teste
ALTER TABLE estimativas DISABLE ROW LEVEL SECURITY;

-- Verificar se as estimativas aparecem sem RLS
SELECT id, nome_projeto, created_by, created_at 
FROM estimativas 
ORDER BY created_at DESC;

-- Reabilitar RLS
ALTER TABLE estimativas ENABLE ROW LEVEL SECURITY;

-- Recriar política de SELECT mais permissiva
DROP POLICY IF EXISTS "estimativas_select_admin" ON estimativas;

CREATE POLICY "estimativas_select_admin" ON estimativas
  FOR SELECT USING (
    -- Permitir para admins
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'admin_operacional')
    )
    OR
    -- Permitir para o criador da estimativa
    created_by = auth.uid()
  );

-- Verificar se o usuário atual tem perfil
SELECT id, email, full_name, role 
FROM profiles 
WHERE id = auth.uid();

-- Verificar se há estimativas do usuário atual
SELECT id, nome_projeto, created_by, created_at 
FROM estimativas 
WHERE created_by = auth.uid();
