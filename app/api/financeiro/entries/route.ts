import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    
    if (!year) {
      return NextResponse.json({ error: 'Ano é obrigatório' }, { status: 400 })
    }

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
      .from('expense_entries')
      .select(`
        *,
        expense_subcategories (
          *,
          expense_categories (name, color, icon)
        )
      `)
      .eq('year', parseInt(year))
      .order('month')

    // Aplicar filtro de tenant baseado no perfil do usuário
    if (profile?.is_client_admin) {
      // Client Admin: buscar company_id e filtrar por tenant_id
      const { data: clientAdmin } = await supabase
        .from('client_admins')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (clientAdmin?.company_id) {
        query = query.eq('tenant_id', clientAdmin.company_id)
      } else {
        query = query.eq('tenant_id', '00000000-0000-0000-0000-000000000000')
      }
    } else {
      // Admin Master/Normal/Operacional: ver apenas despesas sem tenant_id
      query = query.is('tenant_id', null)
    }
    
    // Executar query
    const { data: entries, error: entriesError } = await query

    if (entriesError) {
      console.error('Erro ao buscar entradas:', entriesError)
      return NextResponse.json({ error: 'Erro ao buscar entradas' }, { status: 500 })
    }

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Erro na API de entradas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
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

    let tenantId = null

    // Determinar tenant_id baseado no perfil do usuário
    if (profile?.is_client_admin) {
      // Client Admin: buscar company_id
      const { data: clientAdmin } = await supabase
        .from('client_admins')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      tenantId = clientAdmin?.company_id || null
    }
    // Admin Master/Normal/Operacional: tenantId = null (já definido)

    console.log('Dados recebidos na API de entries:', body)
    console.log('Tenant ID determinado:', tenantId)
    
    const { data, error } = await supabase
      .from('expense_entries')
      .upsert([{ ...body, tenant_id: tenantId }], { 
        onConflict: 'subcategory_id,year,month',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar entrada:', error)
      return NextResponse.json({ error: 'Erro ao salvar entrada', details: error }, { status: 500 })
    }

    console.log('Entrada salva com sucesso:', data)
    return NextResponse.json({ entry: data })
  } catch (error) {
    console.error('Erro na API de entradas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', details: error }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updateData } = body
    
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
      .from('expense_entries')
      .update(updateData)
      .eq('id', id)

    // Aplicar filtro de tenant baseado no perfil do usuário
    if (profile?.is_client_admin) {
      // Client Admin: buscar company_id e filtrar por tenant_id
      const { data: clientAdmin } = await supabase
        .from('client_admins')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (clientAdmin?.company_id) {
        query = query.eq('tenant_id', clientAdmin.company_id)
      } else {
        query = query.eq('tenant_id', '00000000-0000-0000-0000-000000000000')
      }
    } else {
      // Admin Master/Normal/Operacional: ver apenas despesas sem tenant_id
      query = query.is('tenant_id', null)
    }
    
    const { data, error } = await query
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar entrada:', error)
      return NextResponse.json({ error: 'Erro ao atualizar entrada' }, { status: 500 })
    }

    return NextResponse.json({ entry: data })
  } catch (error) {
    console.error('Erro na API de entradas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID da entrada é obrigatório' }, { status: 400 })
    }

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
      .from('expense_entries')
      .delete()
      .eq('id', id)

    // Aplicar filtro de tenant baseado no perfil do usuário
    if (profile?.is_client_admin) {
      // Client Admin: buscar company_id e filtrar por tenant_id
      const { data: clientAdmin } = await supabase
        .from('client_admins')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (clientAdmin?.company_id) {
        query = query.eq('tenant_id', clientAdmin.company_id)
      } else {
        query = query.eq('tenant_id', '00000000-0000-0000-0000-000000000000')
      }
    } else {
      // Admin Master/Normal/Operacional: ver apenas despesas sem tenant_id
      query = query.is('tenant_id', null)
    }

    const { error } = await query

    if (error) {
      console.error('Erro ao deletar entrada:', error)
      return NextResponse.json({ error: 'Erro ao deletar entrada' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de entradas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}