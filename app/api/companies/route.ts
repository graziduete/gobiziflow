// API para listar empresas
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🏢 Buscando empresas...');
    
    const supabase = await createClient();
    
    // Obter dados do usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_client_admin')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('companies')
      .select('id, name, tenant_id')
      .order('name', { ascending: true })

    // Se for Client Admin, filtrar por tenant_id
    if (profile?.is_client_admin) {
      const { data: clientAdmin } = await supabase
        .from('client_admins')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (clientAdmin?.company_id) {
        query = query.eq('tenant_id', clientAdmin.company_id)
      }
    } 
    // Se for Admin Normal, filtrar apenas empresas sem tenant_id (criadas por Admin Master/Normal)
    else if (profile?.role === 'admin' || profile?.role === 'admin_operacional') {
      query = query.is('tenant_id', null)
    }
    
    const { data: companies, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data: companies || []
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar empresas:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao buscar empresas',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}