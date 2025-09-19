import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEETS_COPERCUSAR_ID;
    
    if (!apiKey || !spreadsheetId) {
      return NextResponse.json({ error: 'Variáveis não encontradas' }, { status: 500 });
    }

    // Testar diretamente a API do Google Sheets
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Página1!A:L?key=${apiKey}`;
    
    console.log('🔍 Testando URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erro da API:', errorText);
      return NextResponse.json({ 
        error: 'Erro na API Google Sheets',
        status: response.status,
        details: errorText
      }, { status: 500 });
    }

    const data = await response.json();
    console.log('✅ Dados recebidos:', data);

    return NextResponse.json({
      success: true,
      rowsCount: data.values ? data.values.length : 0,
      firstRow: data.values ? data.values[0] : null,
      data: data
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}