import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Buscar categorias com suas subcategorias
    const { data: categories, error: categoriesError } = await supabase
      .from('expense_categories')
      .select(`
        *,
        expense_subcategories (*)
      `)
      .eq('is_active', true)
      .order('order_index')

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
    
    console.log('Dados recebidos na API:', body)
    
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