import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Listar configurações de Google Sheets
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    let query = supabase
      .from('sustentacao_google_sheets_config')
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .eq('is_active', true);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar configurações de Google Sheets:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar configurações de Google Sheets' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data || [] 
    });

  } catch (error) {
    console.error('Erro no endpoint google-sheets-config:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// POST - Criar nova configuração de Google Sheets
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const { 
      companyId, 
      spreadsheetId, 
      tabName = 'Página1'
    } = body;

    if (!companyId || !spreadsheetId) {
      return NextResponse.json({ 
        success: false, 
        error: 'companyId e spreadsheetId são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se já existe configuração ativa para esta empresa
    const { data: existingConfig } = await supabase
      .from('sustentacao_google_sheets_config')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single();

    if (existingConfig) {
      return NextResponse.json({ 
        success: false, 
        error: 'Já existe uma configuração ativa para esta empresa' 
      }, { status: 400 });
    }

    // Criar nova configuração
    const { data, error } = await supabase
      .from('sustentacao_google_sheets_config')
      .insert({
        company_id: companyId,
        spreadsheet_id: spreadsheetId,
        tab_name: tabName,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar configuração de Google Sheets:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao criar configuração de Google Sheets' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data 
    });

  } catch (error) {
    console.error('Erro no POST google-sheets-config:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// PUT - Atualizar configuração de Google Sheets
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const { 
      id,
      companyId, 
      spreadsheetId, 
      tabName = 'Página1'
    } = body;

    if (!id || !companyId || !spreadsheetId) {
      return NextResponse.json({ 
        success: false, 
        error: 'id, companyId e spreadsheetId são obrigatórios' 
      }, { status: 400 });
    }

    // Atualizar configuração
    const { data, error } = await supabase
      .from('sustentacao_google_sheets_config')
      .update({
        company_id: companyId,
        spreadsheet_id: spreadsheetId,
        tab_name: tabName,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar configuração de Google Sheets:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar configuração de Google Sheets' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data 
    });

  } catch (error) {
    console.error('Erro no PUT google-sheets-config:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// DELETE - Deletar configuração de Google Sheets
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'id é obrigatório' 
      }, { status: 400 });
    }

    // Deletar configuração
    const { error } = await supabase
      .from('sustentacao_google_sheets_config')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar configuração de Google Sheets:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao deletar configuração de Google Sheets' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Configuração deletada com sucesso' 
    });

  } catch (error) {
    console.error('Erro no DELETE google-sheets-config:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}