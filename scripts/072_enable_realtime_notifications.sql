-- =============================================
-- Script: Habilitar Realtime para Notifications
-- Descrição: Ativa o Realtime no Supabase para a tabela notifications
-- =============================================

-- 1. Verificar se a tabela notifications existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    RAISE NOTICE 'ERRO: Tabela notifications não existe!';
  ELSE
    RAISE NOTICE '✅ Tabela notifications encontrada';
  END IF;
END $$;

-- 2. Habilitar Realtime na tabela notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 3. Verificar Row Level Security (RLS)
-- O RLS deve permitir que usuários vejam apenas suas próprias notificações
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname LIKE '%select%'
  ) THEN
    RAISE NOTICE '⚠️  ATENÇÃO: Policies de SELECT não encontradas para notifications';
  ELSE
    RAISE NOTICE '✅ Policies encontradas';
  END IF;
END $$;

-- 4. Garantir que a policy permite realtime
-- Recriar policy de SELECT para garantir compatibilidade com Realtime
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Garantir que a policy de INSERT existe
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- 6. Policy de UPDATE
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Verificação final
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Resultado esperado:
-- ✅ Realtime habilitado na tabela notifications
-- ✅ Policies configuradas corretamente
-- ✅ RLS ativo e funcional

