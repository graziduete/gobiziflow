import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🔍 [TestNotifications] Verificando notificações...')
    
    // Buscar notificações do usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' })
    }
    
    console.log('🔍 [TestNotifications] Usuário:', user.id)
    
    // Buscar notificações
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log('🔍 [TestNotifications] Notificações encontradas:', notifications?.length || 0)
    
    if (notificationsError) {
      return NextResponse.json({ error: `Erro ao buscar notificações: ${notificationsError.message}` })
    }
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      notifications: notifications || [],
      count: notifications?.length || 0
    })

  } catch (error) {
    console.error('🔍 [TestNotifications] Erro geral:', error)
    return NextResponse.json({ error: `Erro: ${error}` })
  }
}
