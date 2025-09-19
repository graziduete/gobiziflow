// API Mock para configurações de empresas (sem banco de dados)
import { NextRequest, NextResponse } from 'next/server';

// Dados mockados em memória
let mockConfigs: any[] = [];
let mockCompanies = [
  { id: 'copersucar', name: 'Copersucar' },
  { id: 'empresa2', name: 'Empresa ABC' },
  { id: 'empresa3', name: 'Empresa XYZ' }
];

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Buscando configurações de empresas (MOCK)...');
    
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    if (companyId) {
      // Buscar configuração de uma empresa específica
      const config = mockConfigs.find(c => c.company_id === companyId && c.status === 'ativo');
      
      return NextResponse.json({
        success: true,
        data: config || null
      });
    } else {
      // Listar todas as configurações ativas
      return NextResponse.json({
        success: true,
        data: mockConfigs.filter(c => c.status === 'ativo')
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar configurações (MOCK):', error);
    
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
    console.log('💾 Criando configuração de empresa (MOCK)...');
    
    const body = await request.json();
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
    
    // Verificar se já existe configuração ativa
    const existingConfig = mockConfigs.find(c => c.company_id === companyId && c.status === 'ativo');
    
    if (existingConfig) {
      return NextResponse.json(
        { error: 'Já existe uma configuração ativa para esta empresa' },
        { status: 400 }
      );
    }
    
    // Criar nova configuração
    const newConfig = {
      id: `config_${Date.now()}`,
      company_id: companyId,
      horas_contratadas: parseFloat(horasContratadas),
      data_inicio: dataInicio,
      data_fim: dataFim,
      saldo_negativo: saldoNegativo,
      status: 'ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      companies: mockCompanies.find(c => c.id === companyId)
    };
    
    mockConfigs.push(newConfig);
    
    console.log('✅ Configuração criada (MOCK):', newConfig);
    
    return NextResponse.json({
      success: true,
      data: newConfig
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar configuração (MOCK):', error);
    
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
    console.log('🔄 Atualizando configuração de empresa (MOCK)...');
    
    const body = await request.json();
    const { 
      configId,
      companyId, 
      horasContratadas, 
      dataInicio, 
      dataFim, 
      saldoNegativo = false 
    } = body;
    
    if (!configId) {
      return NextResponse.json(
        { error: 'configId é obrigatório' },
        { status: 400 }
      );
    }
    
    // Encontrar e atualizar configuração
    const configIndex = mockConfigs.findIndex(c => c.id === configId);
    
    if (configIndex === -1) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      );
    }
    
    // Atualizar configuração
    mockConfigs[configIndex] = {
      ...mockConfigs[configIndex],
      horas_contratadas: horasContratadas ? parseFloat(horasContratadas) : mockConfigs[configIndex].horas_contratadas,
      data_inicio: dataInicio || mockConfigs[configIndex].data_inicio,
      data_fim: dataFim || mockConfigs[configIndex].data_fim,
      saldo_negativo: saldoNegativo,
      updated_at: new Date().toISOString()
    };
    
    console.log('✅ Configuração atualizada (MOCK):', mockConfigs[configIndex]);
    
    return NextResponse.json({
      success: true,
      data: mockConfigs[configIndex]
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar configuração (MOCK):', error);
    
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
    console.log('🗑️ Desativando configuração de empresa (MOCK)...');
    
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');
    
    if (!configId) {
      return NextResponse.json(
        { error: 'configId é obrigatório' },
        { status: 400 }
      );
    }
    
    // Encontrar e desativar configuração
    const configIndex = mockConfigs.findIndex(c => c.id === configId);
    
    if (configIndex === -1) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      );
    }
    
    // Desativar configuração
    mockConfigs[configIndex] = {
      ...mockConfigs[configIndex],
      status: 'inativo',
      updated_at: new Date().toISOString()
    };
    
    console.log('✅ Configuração desativada (MOCK):', mockConfigs[configIndex]);
    
    return NextResponse.json({
      success: true,
      data: mockConfigs[configIndex]
    });
    
  } catch (error) {
    console.error('❌ Erro ao desativar configuração (MOCK):', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao desativar configuração',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}