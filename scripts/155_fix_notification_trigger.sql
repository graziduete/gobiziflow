-- Script 155: Corrigir trigger de notificações para considerar tenant_id
-- Este script corrige o trigger para enviar notificações apenas para usuários do mesmo tenant

-- ============================================
-- 1. RECRIAR FUNÇÃO DE NOTIFICAÇÃO CORRIGIDA
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_on_project_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  should_notify boolean;
  project_tenant_id UUID;
  creator_profile RECORD;
BEGIN
  -- Verificar se notificações estão habilitadas
  SELECT s.notify_project_created INTO should_notify FROM public.settings s WHERE s.id = 1;
  
  IF should_notify THEN
    -- Obter o tenant_id do projeto
    project_tenant_id := NEW.tenant_id;
    
    -- Obter dados do criador
    SELECT role, is_client_admin INTO creator_profile
    FROM public.profiles 
    WHERE id = NEW.created_by;
    
    -- Inserir notificações baseado no tenant_id
    IF project_tenant_id IS NULL THEN
      -- Projeto sem tenant_id (Admin Master/Normal): notificar usuários de user_companies
      INSERT INTO public.notifications (user_id, company_id, project_id, type, title, message, created_at)
      SELECT uc.user_id,
             NEW.company_id,
             NEW.id,
             'project_created',
             'Novo projeto criado — ' || NEW.name,
             'Projeto criado para a empresa',
             NEW.created_at
      FROM public.user_companies uc
      LEFT JOIN public.user_notification_prefs up ON up.user_id = uc.user_id
      WHERE uc.company_id = NEW.company_id
        AND COALESCE(up.project_created, true) = true;
        
    ELSE
      -- Projeto com tenant_id (Client Admin): notificar apenas usuários do mesmo tenant
      INSERT INTO public.notifications (user_id, company_id, project_id, type, title, message, created_at)
      SELECT uc.user_id,
             NEW.company_id,
             NEW.id,
             'project_created',
             'Novo projeto criado — ' || NEW.name,
             'Projeto criado para a empresa',
             NEW.created_at
      FROM public.user_companies uc
      LEFT JOIN public.user_notification_prefs up ON up.user_id = uc.user_id
      WHERE uc.company_id = project_tenant_id  -- Usar tenant_id como company_id para filtrar
        AND COALESCE(up.project_created, true) = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- 2. VERIFICAR SE O TRIGGER AINDA EXISTE
-- ============================================

SELECT 
    'Trigger Status' as info,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trg_project_created_notifications';

-- ============================================
-- 3. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON FUNCTION public.notify_on_project_created() IS 'Notifica usuários sobre criação de projetos, respeitando isolamento por tenant_id';

RAISE NOTICE '✅ Função notify_on_project_created() corrigida para considerar tenant_id.';
