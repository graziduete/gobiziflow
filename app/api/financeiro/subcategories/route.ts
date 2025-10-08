import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Buscar subcategorias
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('expense_subcategories')
      .select(`
        *,
        expense_categories (name, color, icon)
      `)
      .eq('is_active', true)
      .order('name')

    if (subcategoriesError) {
      console.error('Erro ao buscar subcategorias:', subcategoriesError)
      return NextResponse.json({ error: 'Erro ao buscar subcategorias' }, { status: 500 })
    }

    return NextResponse.json({ subcategories })
  } catch (error) {
    console.error('Erro na API de subcategorias:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('expense_subcategories')
      .insert([body])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar subcategoria:', error)
      return NextResponse.json({ error: 'Erro ao criar subcategoria' }, { status: 500 })
    }

    return NextResponse.json({ subcategory: data })
  } catch (error) {
    console.error('Erro na API de subcategorias:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updateData } = body
    
    const { data, error } = await supabase
      .from('expense_subcategories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar subcategoria:', error)
      return NextResponse.json({ error: 'Erro ao atualizar subcategoria' }, { status: 500 })
    }

    return NextResponse.json({ subcategory: data })
  } catch (error) {
    console.error('Erro na API de subcategorias:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID da subcategoria é obrigatório' }, { status: 400 })
    }

    const { error } = await supabase
      .from('expense_subcategories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar subcategoria:', error)
      return NextResponse.json({ error: 'Erro ao deletar subcategoria' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de subcategorias:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
