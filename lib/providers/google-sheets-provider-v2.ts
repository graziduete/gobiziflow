import { google } from 'googleapis';

export class GoogleSheetsProviderV2 {
  private apiKey: string;
  private spreadsheetId: string;
  private tabName: string;

  constructor(spreadsheetId: string, tabName: string = 'Página1') {
    this.apiKey = process.env.GOOGLE_SHEETS_API_KEY || '';
    this.spreadsheetId = spreadsheetId;
    this.tabName = tabName;
  }

  // Método para buscar dados da planilha específica
  async getChamados(filters: any) {
    try {
      if (!this.apiKey) {
        throw new Error('GOOGLE_SHEETS_API_KEY não configurado');
      }

      if (!this.spreadsheetId) {
        throw new Error('Spreadsheet ID não configurado');
      }

      // Adicionar delay para evitar 429 (Too Many Requests)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const sheets = google.sheets({ version: 'v4', auth: this.apiKey });
      const range = `${this.tabName}!A:L`;
      
      console.log(`🔍 Buscando dados da planilha: ${this.spreadsheetId}, aba: ${this.tabName}`);
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('⚠️ Nenhum dado encontrado na planilha');
        return [];
      }

      // Processar dados (mesma lógica do provider original)
      const headers = rows[0];
      const dataRows = rows.slice(1);

      const chamados = dataRows.map((row: any[]) => {
        const chamado: any = {};
        headers.forEach((header: string, index: number) => {
          chamado[header] = row[index] || '';
        });

        // Mapear campos para o formato esperado pelo frontend
        chamado.idEllevo = chamado['#id'];
        chamado.automacao = chamado.númerorpa;
        chamado.dataAbertura = chamado.dataabertura;
        chamado.dataResolucao = chamado.dataresolução;
        chamado.tempoAtendimento = chamado.horas;
        chamado.assunto = chamado.assunto;
        chamado.categoria = chamado.categoria;
        chamado.status = chamado.status;
        chamado.solicitante = chamado.solicitante;

        return chamado;
      });

      // Aplicar filtros
      let filteredChamados = chamados;

      if (filters.mes && filters.ano) {
        filteredChamados = chamados.filter((chamado: any) => {
          const mesChamado = parseInt(chamado.mês) || 0;
          const anoChamado = parseInt(chamado.ano) || 0;
          return mesChamado === filters.mes && anoChamado === filters.ano;
        });
      } else if (filters.ano) {
        filteredChamados = chamados.filter((chamado: any) => {
          const anoChamado = parseInt(chamado.ano) || 0;
          return anoChamado === filters.ano;
        });
      }

      console.log(`✅ ${filteredChamados.length} chamados encontrados para os filtros aplicados`);
      return filteredChamados;

    } catch (error: any) {
      console.error('❌ Erro ao buscar dados da planilha:', error.message);
      
      // Retry logic para 429 (Too Many Requests)
      if (error.message.includes('429')) {
        console.log('⏳ Aguardando 5 segundos antes de tentar novamente...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.getChamados(filters);
      }
      
      throw error;
    }
  }

  // Métodos auxiliares (copiados do provider original)
  private converterRelogioParaDecimal(tempo: string): number {
    if (!tempo || typeof tempo !== 'string') return 0;
    
    const partes = tempo.split(':');
    if (partes.length !== 2) return 0;
    
    const horas = parseInt(partes[0]) || 0;
    const minutos = parseInt(partes[1]) || 0;
    
    return horas + (minutos / 60);
  }

  private converterDecimalParaRelogio(decimal: number): string {
    if (isNaN(decimal) || decimal < 0) return '00:00';
    
    const horas = Math.floor(decimal);
    const minutos = Math.round((decimal - horas) * 60);
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }

  private somarTempos(tempo1: string, tempo2: string): string {
    const decimal1 = this.converterRelogioParaDecimal(tempo1);
    const decimal2 = this.converterRelogioParaDecimal(tempo2);
    const soma = decimal1 + decimal2;
    
    return this.converterDecimalParaRelogio(soma);
  }
}