import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEETS_COPERCUSAR_ID;
    
    return NextResponse.json({
      hasApiKey: !!apiKey,
      hasSpreadsheetId: !!spreadsheetId,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'N/A',
      spreadsheetIdPreview: spreadsheetId ? `${spreadsheetId.substring(0, 10)}...` : 'N/A'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao verificar variáveis' }, { status: 500 });
  }
}