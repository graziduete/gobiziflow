// API para gerenciar configurações de empresas na sustentação
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Buscando configurações de empresas...');
    
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    const supabase = await createClient();
    
    if (companyId) {
      // Buscar configuração ativa e não expirada de uma empresa específica
      const { data: configs, error } = await supabase
        .from('sustentacao_empresa_config')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Verificar se alguma configuração ativa não está expirada
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const activeNonExpiredConfig = configs?.find(config => 
        !config.data_fim || config.data_fim >= today
      );
      
      return NextResponse.json({
        success: true,
        data: activeNonExpiredConfig || null
      });
    } else {
      // Listar todas as configurações ativas
      const { data: configs, error } = await supabase
        .from('sustentacao_empresa_config')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return NextResponse.json({
        success: true,
        data: configs || []
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar configurações:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao buscar configurações',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('💾 Criando configuração de empresa...');
    
    const body = await request.json();
    console.log('📝 Dados recebidos:', body);
    
        const { 
          companyId, 
          horasContratadas, 
          dataInicio, 
          dataFim, 
          saldoNegativo = false
        } = body;
    
    if (!companyId || !horasContratadas || !dataInicio || !dataFim) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: companyId, horasContratadas, dataInicio, dataFim' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Verificar se já existe configuração ativa e não expirada
    const { data: existingConfigs } = await supabase
      .from('sustentacao_empresa_config')
      .select('id, data_fim')
      .eq('company_id', companyId)
      .eq('status', 'ativo');
    
    // Verificar se alguma configuração ativa não está expirada
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const activeNonExpiredConfig = existingConfigs?.find(config => 
      !config.data_fim || config.data_fim >= today
    );
    
    if (activeNonExpiredConfig) {
      return NextResponse.json(
        { error: 'Já existe uma configuração ativa para esta empresa' },
        { status: 400 }
      );
    }
    
    // Criar nova configuração
    console.log('🔧 Dados para inserção:', {
      company_id: companyId,
      horas_contratadas: parseFloat(horasContratadas),
      data_inicio: dataInicio,
      data_fim: dataFim,
      saldo_negativo: saldoNegativo,
      google_sheets_spreadsheet_id: googleSheetsSpreadsheetId,
      google_sheets_tab: googleSheetsTab,
      status: 'ativo'
    });
    
    const { data: config, error } = await supabase
      .from('sustentacao_empresa_config')
      .insert({
        company_id: companyId,
        horas_contratadas: parseFloat(horasContratadas),
        data_inicio: dataInicio,
        data_fim: dataFim,
        saldo_negativo: saldoNegativo,
        status: 'ativo'
      })
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .single();
    
    if (error) {
      console.error('❌ Erro do Supabase:', error);
      throw error;
    }
    
    console.log('✅ Configuração criada:', config);
    
    return NextResponse.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar configuração:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao criar configuração',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}



export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Atualizando configuração de empresa...');
    
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');
    
    const body = await request.json();
        const { 
          companyId,
          horasContratadas,
          dataInicio,
          dataFim,
          saldoNegativo
        } = body;
    
    if (!configId || !companyId || !horasContratadas || !dataInicio || !dataFim) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: configId, companyId, horasContratadas, dataInicio, dataFim' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Atualizar configuração específica por ID
    const { data: config, error } = await supabase
      .from('sustentacao_empresa_config')
      .update({
        horas_contratadas: parseFloat(horasContratadas),
        data_inicio: dataInicio,
        data_fim: dataFim,
        saldo_negativo: saldoNegativo,
        updated_at: new Date().toISOString()
      })
      .eq('id', configId)
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Configuração atualizada:', config);
    
    return NextResponse.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar configuração:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao atualizar configuração',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Excluindo configuração de empresa...');
    
    const body = await request.json();
    const { configId } = body;
    
    if (!configId) {
      return NextResponse.json(
        { error: 'Config ID é obrigatório' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Primeiro, verificar se a configuração existe
    const { data: existingConfig, error: fetchError } = await supabase
      .from('sustentacao_empresa_config')
      .select('id, status, company_id')
      .eq('id', configId)
      .single();
    
    if (fetchError) {
      throw new Error(`Configuração não encontrada: ${fetchError.message}`);
    }
    
    // Deletar configuração permanentemente (hard delete)
    const { error } = await supabase
      .from('sustentacao_empresa_config')
      .delete()
      .eq('id', configId);
    
    if (error) {
      throw error;
    }
    
    // Retornar dados da configuração deletada
    const config = existingConfig;
    
    console.log('✅ Configuração excluída:', config);
    
    return NextResponse.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('❌ Erro ao excluir configuração:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao excluir configuração',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}