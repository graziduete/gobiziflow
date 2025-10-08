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

    // Buscar entradas de despesas com informações das subcategorias e categorias
    const { data: entries, error: entriesError } = await supabase
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
    
    console.log('Dados recebidos na API de entries:', body)
    
    const { data, error } = await supabase
      .from('expense_entries')
      .upsert([body], { 
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
    
    const { data, error } = await supabase
      .from('expense_entries')
      .update(updateData)
      .eq('id', id)
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

    const { error } = await supabase
      .from('expense_entries')
      .delete()
      .eq('id', id)

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