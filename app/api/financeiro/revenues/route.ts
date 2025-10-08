import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== API Receitas GET ===')
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const client = searchParams.get('client')
    const type = searchParams.get('type')
    
    console.log('Filtros recebidos:', { year, month, client, type })
    
    // Primeiro, vamos verificar TODAS as receitas sem filtros
    const { data: allRevenues, error: allError } = await supabase
      .from('revenue_entries')
      .select('*')
      .order('date', { ascending: false })
    
    console.log('🔍 Debug - TODAS as receitas (sem filtros):', {
      count: allRevenues?.length || 0,
      revenues: allRevenues?.map(r => ({ id: r.id, type: r.type, month: r.month, amount: r.amount, date: r.date }))
    })
    
    let query = supabase
      .from('revenue_entries')
      .select('*')
      .order('date', { ascending: false })
    
    // Filtros
    if (year) {
      // Filtrar por ano usando range de datas
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      query = query.gte('date', startDate).lte('date', endDate)
    }
    
    if (month) {
      query = query.eq('month', parseInt(month))
    }
    
    if (client) {
      query = query.ilike('client', `%${client}%`)
    }
    
    if (type) {
      query = query.ilike('type', `%${type}%`)
    }
    
    console.log('Executando query...')
    const { data, error } = await query
    
    if (error) {
      console.error('Erro ao buscar receitas:', error)
      return NextResponse.json({ error: 'Erro ao buscar receitas', details: error }, { status: 500 })
    }
    
    console.log('Dados encontrados:', data?.length || 0, 'registros')
    console.log('Primeiro registro:', data?.[0])
    
    return NextResponse.json({ revenues: data || [] })
  } catch (error) {
    console.error('Erro na API de receitas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', details: error }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    console.log('Dados recebidos na API de receitas:', body)
    
    const { data, error } = await supabase
      .from('revenue_entries')
      .insert([body])
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar receita:', error)
      return NextResponse.json({ error: 'Erro ao criar receita', details: error }, { status: 500 })
    }
    
    console.log('Receita criada com sucesso:', data)
    return NextResponse.json({ revenue: data })
  } catch (error) {
    console.error('Erro na API de receitas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', details: error }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID da receita é obrigatório' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('revenue_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao atualizar receita:', error)
      return NextResponse.json({ error: 'Erro ao atualizar receita', details: error }, { status: 500 })
    }
    
    return NextResponse.json({ revenue: data })
  } catch (error) {
    console.error('Erro na API de receitas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', details: error }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID da receita é obrigatório' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('revenue_entries')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Erro ao deletar receita:', error)
      return NextResponse.json({ error: 'Erro ao deletar receita', details: error }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de receitas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor', details: error }, { status: 500 })
  }
}
