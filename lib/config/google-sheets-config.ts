// Configuração Google Sheets para Sustentação
export interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  sheetName: string;
  configSheetName: string;
}

// Configuração para diferentes empresas
export const GOOGLE_SHEETS_CONFIGS = {
  copersucar: {
    spreadsheetId: process.env.GOOGLE_SHEETS_COPERCUSAR_ID || 'SPREADSHEET_ID_AQUI',
    apiKey: process.env.GOOGLE_SHEETS_API_KEY || 'API_KEY_AQUI',
    sheetName: 'Chamados',
    configSheetName: 'Configuração'
  },
  
  empresaB: {
    spreadsheetId: process.env.GOOGLE_SHEETS_EMPRESA_B_ID || 'SPREADSHEET_ID_AQUI',
    apiKey: process.env.GOOGLE_SHEETS_API_KEY || 'API_KEY_AQUI',
    sheetName: 'Chamados',
    configSheetName: 'Configuração'
  }
};

// Função para obter configuração por empresa
export function getGoogleSheetsConfig(companyId: string): GoogleSheetsConfig {
  return GOOGLE_SHEETS_CONFIGS[companyId as keyof typeof GOOGLE_SHEETS_CONFIGS] || GOOGLE_SHEETS_CONFIGS.empresaB;
}

// Validação de configuração
export function validateGoogleSheetsConfig(config: GoogleSheetsConfig): boolean {
  return !!(
    config.spreadsheetId &&
    config.apiKey &&
    config.sheetName &&
    config.spreadsheetId !== 'SPREADSHEET_ID_AQUI' &&
    config.apiKey !== 'API_KEY_AQUI'
  );
}

// URLs de exemplo para diferentes meses
export const SPREADSHEET_URLS = {
  setembro2025: 'https://docs.google.com/spreadsheets/d/1ABC123.../edit',
  outubro2025: 'https://docs.google.com/spreadsheets/d/1DEF456.../edit',
  novembro2025: 'https://docs.google.com/spreadsheets/d/1GHI789.../edit'
};

// Função para extrair ID da planilha da URL
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}