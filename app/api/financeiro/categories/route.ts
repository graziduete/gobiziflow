import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Obter dados do usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Buscar perfil do usuário para filtrar subcategorias
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_client_admin')
      .eq('id', user.id)
      .single()

    // Buscar categorias (sempre todas - categorias são fixas)
    let categoriesQuery = supabase
      .from('expense_categories')
      .select(`
        *,
        expense_subcategories (*)
      `)
      .eq('is_active', true)
      .order('order_index')

    // Para subcategorias, aplicar filtro de tenant baseado no perfil do usuário
    if (profile?.is_client_admin) {
      // Client Admin: buscar company_id e filtrar subcategorias por tenant_id
      const { data: clientAdmin } = await supabase
        .from('client_admins')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (clientAdmin?.company_id) {
        categoriesQuery = categoriesQuery.eq('expense_subcategories.tenant_id', clientAdmin.company_id)
      } else {
        categoriesQuery = categoriesQuery.eq('expense_subcategories.tenant_id', '00000000-0000-0000-0000-000000000000')
      }
    } else {
      // Admin Master/Normal/Operacional: ver apenas subcategorias sem tenant_id
      categoriesQuery = categoriesQuery.is('expense_subcategories.tenant_id', null)
    }
    
    // Executar query
    const { data: categories, error: categoriesError } = await categoriesQuery

    if (categoriesError) {
      console.error('Erro ao buscar categorias:', categoriesError)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Erro na API de categorias:', error)
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

    console.log('Dados recebidos na API categorias:', body)
    
    // Categorias são fixas - não precisam de tenant_id
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([body])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar categoria:', error)
      return NextResponse.json({ error: 'Erro ao criar categoria', details: error }, { status: 500 })
    }

    console.log('Categoria criada com sucesso:', data)
    return NextResponse.json({ category: data })
  } catch (error) {
    console.error('Erro na API de categorias:', error)
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

    // Categorias são fixas - qualquer usuário pode editar
    const { data, error } = await supabase
      .from('expense_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar categoria:', error)
      return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 })
    }

    return NextResponse.json({ category: data })
  } catch (error) {
    console.error('Erro na API de categorias:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID da categoria é obrigatório' }, { status: 400 })
    }

    // Obter dados do usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Categorias são fixas - qualquer usuário pode deletar
    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar categoria:', error)
      return NextResponse.json({ error: 'Erro ao deletar categoria' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de categorias:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}