import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsProviderV2 } from '@/lib/providers/google-sheets-provider-v2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Aceitar tanto { mes, ano, companyId } quanto { companyId, filters: { mes, ano } }
    const companyId: string | undefined = body.companyId ?? body.filters?.companyId;
    const mes: number = body.mes ?? body.filters?.mes ?? (new Date().getMonth() + 1);
    const ano: number = body.ano ?? body.filters?.ano ?? (new Date().getFullYear());

    console.log('📊 [V2] Buscando chamados com nova lógica...', { mes, ano, companyId, rawBodyKeys: Object.keys(body || {}) });

    // Verificar configuração
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

    if (!apiKey) {
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

    // Buscar configuração da empresa
    let spreadsheetId: string;
    let tabName: string = 'Página1';

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

    // UUID real da Copersucar
    const COPERSUCAR_ID = '443a6a0e-768f-48e4-a9ea-0cd972375a30';

    if (companyId === COPERSUCAR_ID) {
      // Copersucar usa configuração hardcoded
      spreadsheetId = process.env.GOOGLE_SHEETS_COPERCUSAR_ID || '';
      if (!spreadsheetId) {
        console.error('❌ Configuração Copersucar não encontrada');
        return NextResponse.json(
          { 
            success: false,
            error: 'Configuração Copersucar não encontrada',
            message: 'Variável GOOGLE_SHEETS_COPERCUSAR_ID não configurada'
          },
          { status: 500 }
        );
      }
    } else {
      // Outras empresas usam configuração do banco
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        
        const { data: config, error } = await supabase
          .from('sustentacao_google_sheets_config')
          .select('spreadsheet_id, tab_name')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .single();

        if (error || !config) {
          console.error('❌ Configuração Google Sheets não encontrada para empresa:', companyId);
          return NextResponse.json(
            { 
              success: false,
              error: 'Configuração Google Sheets não encontrada',
              message: `Empresa ${companyId} não possui configuração de Google Sheets`
            },
            { status: 404 }
          );
        }

        spreadsheetId = config.spreadsheet_id;
        tabName = config.tab_name || 'Página1';
        
        console.log('✅ Configuração encontrada:', { companyId, spreadsheetId, tabName });
      } catch (error) {
        console.error('❌ Erro ao buscar configuração:', error);
        return NextResponse.json(
          { 
            success: false,
            error: 'Erro ao buscar configuração',
            message: 'Falha ao consultar configuração da empresa'
          },
          { status: 500 }
        );
      }
    }

    // Criar provider V2
    const provider = new GoogleSheetsProviderV2(spreadsheetId, tabName);

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

    // Buscar dados (sempre incluir companyId nos filtros para métricas)
    const filtros = { mes, ano, companyId };
    const chamados = await provider.getChamados(filtros);
    const metricas = await provider.getMetricas(filtros);
    const categorias = await provider.getChamadosPorCategoria(filtros);

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