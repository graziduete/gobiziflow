import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsProvider } from '@/lib/providers/google-sheets-provider';

export async function POST(request: NextRequest) {
  try {
    const { companyId, filters } = await request.json();

    // Verificar se as variáveis de ambiente estão configuradas
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEETS_COPERCUSAR_ID;
    
    console.log('🔧 Configuração Google Sheets:', {
      hasApiKey: !!apiKey,
      hasSpreadsheetId: !!spreadsheetId,
      spreadsheetId: spreadsheetId?.substring(0, 10) + '...'
    });

    if (!apiKey || !spreadsheetId) {
      console.log('❌ Google Sheets não configurado:', {
        hasApiKey: !!apiKey,
        hasSpreadsheetId: !!spreadsheetId
      });
      return NextResponse.json(
        { error: 'Google Sheets não configurado', details: { hasApiKey: !!apiKey, hasSpreadsheetId: !!spreadsheetId } },
        { status: 500 }
      );
    }

    // Criar provider Google Sheets
    const provider = new GoogleSheetsProvider({
      spreadsheetId,
      apiKey
    });

    // Incluir companyId nos filtros para o provider
    const filtersWithCompany = {
      ...filters,
      companyId
    };

    // Buscar dados (com retry automático nos métodos)
    const [chamados, metricas, categorias] = await Promise.all([
      provider.getChamados(filters),
      provider.getMetricas(filtersWithCompany),
      provider.getChamadosPorCategoria(filters)
    ]);

    return NextResponse.json({
      chamados,
      metricas,
      categorias,
      success: true
    });

  } catch (error) {
    console.error('Erro na API de sustentação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}