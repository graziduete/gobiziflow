import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsProvider } from '@/lib/providers/google-sheets-provider';
import { localCache, createCacheKey } from '@/lib/cache/local-cache';

export async function POST(request: NextRequest) {
  try {
    const { companyId, filters } = await request.json();

    // Criar chave de cache
    const cacheKey = createCacheKey('chamados', { companyId, ...filters });
    
    // Tentar buscar do cache primeiro (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      const cachedData = localCache.get(cacheKey);
      if (cachedData) {
        console.log('🚀 Retornando dados do cache local');
        return NextResponse.json({
          ...cachedData,
          cached: true,
          cacheKey
        });
      }
    }

    console.log('🌐 Buscando dados do Google Sheets...');
    const startTime = Date.now();

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

    const responseData = {
      chamados,
      metricas,
      categorias,
      success: true,
      loadTime: Date.now() - startTime
    };

    // Salvar no cache (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      localCache.set(cacheKey, responseData);
      console.log(`⏱️ Dados carregados em ${responseData.loadTime}ms e salvos no cache`);
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Erro na API de sustentação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}