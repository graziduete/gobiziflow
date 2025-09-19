import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsProviderV2 } from '@/lib/providers/google-sheets-provider-v2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mes, ano, companyId } = body;

    console.log('📊 [V2] Buscando chamados com nova lógica...', { mes, ano, companyId });

    // Verificar configuração
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEETS_COPERCUSAR_ID;

    if (!apiKey || !spreadsheetId) {
      console.error('❌ Configuração Google Sheets não encontrada');
      return NextResponse.json(
        { 
          success: false,
          error: 'Configuração Google Sheets não encontrada',
          message: 'Variáveis de ambiente não configuradas'
        },
        { status: 500 }
      );
    }

    if (!companyId) {
      console.error('❌ Company ID não fornecido');
      return NextResponse.json(
        { 
          success: false,
          error: 'Company ID é obrigatório',
          message: 'ID da empresa não fornecido'
        },
        { status: 400 }
      );
    }

    // Criar provider V2
    const provider = new GoogleSheetsProviderV2({
      spreadsheetId,
      apiKey,
      companyId
    });

    // Testar conexão
    const isConnected = await provider.testConnection();
    if (!isConnected) {
      console.error('❌ Falha na conexão com Google Sheets');
      return NextResponse.json(
        { 
          success: false,
          error: 'Falha na conexão com Google Sheets',
          message: 'Não foi possível conectar com a planilha'
        },
        { status: 500 }
      );
    }

    // Buscar dados
    const chamados = await provider.getChamados({ mes, ano });
    const metricas = await provider.getMetricas({ mes, ano });
    const categorias = await provider.getChamadosPorCategoria({ mes, ano });

    console.log('✅ [V2] Dados obtidos com sucesso:', {
      chamados: chamados.length,
      metricas,
      categorias: categorias.length
    });

    return NextResponse.json({
      success: true,
      data: {
        chamados,
        metricas,
        categorias
      }
    });

  } catch (error) {
    console.error('❌ [V2] Erro ao buscar dados:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao buscar dados',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}